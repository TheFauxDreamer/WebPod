#!/usr/bin/env python3
"""WebPod launcher — auto-installs dependencies on first run."""

import subprocess
import sys
import webbrowser
import threading


def check_python_version():
    if sys.version_info < (3, 8):
        print(f"Error: Python 3.8+ required, found {sys.version}")
        sys.exit(1)


def setup_libgpod_paths():
    """Auto-configure paths to find libgpod in the extracted release."""
    import os

    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)

    lib_paths = []
    python_paths = []

    # Build version search list: current Python version down to 3.10
    current_minor = sys.version_info[1]
    pyversions = [f'3.{v}' for v in range(current_minor, 9, -1)]

    if sys.platform == 'win32':
        # Windows: mingw64/bin and mingw64/lib/python3.X/site-packages
        mingw_bin = os.path.join(parent_dir, 'mingw64', 'bin')
        if os.path.isdir(mingw_bin):
            lib_paths.append(mingw_bin)
        for pyver in pyversions:
            sp = os.path.join(parent_dir, 'mingw64', 'lib', f'python{pyver}', 'site-packages')
            if os.path.isdir(sp):
                python_paths.append(sp)
                break
    else:
        # macOS/Linux: usr/local/lib and usr/local/lib/pythonX.X/site-packages
        usr_lib = os.path.join(parent_dir, 'usr', 'local', 'lib')
        if os.path.isdir(usr_lib):
            lib_paths.append(usr_lib)
        for pyver in pyversions:
            sp = os.path.join(usr_lib, f'python{pyver}', 'site-packages')
            if os.path.isdir(sp):
                python_paths.append(sp)
                break

    # Fallback: recursively search for gpod module if not found at expected path
    if not python_paths:
        search_root = os.path.join(parent_dir, 'mingw64') if sys.platform == 'win32' \
            else os.path.join(parent_dir, 'usr', 'local')
        for dirpath, dirnames, filenames in os.walk(search_root):
            if os.path.basename(dirpath) == 'gpod' and ('__init__.py' in filenames or 'ipod.py' in filenames):
                # Found gpod package; its parent is the site-packages equivalent
                python_paths.append(os.path.dirname(dirpath))
                break

    # Set environment variables for native libraries
    if lib_paths:
        if sys.platform == 'darwin':
            existing = os.environ.get('DYLD_LIBRARY_PATH', '')
            os.environ['DYLD_LIBRARY_PATH'] = ':'.join(lib_paths + ([existing] if existing else []))
        elif sys.platform != 'win32':
            existing = os.environ.get('LD_LIBRARY_PATH', '')
            os.environ['LD_LIBRARY_PATH'] = ':'.join(lib_paths + ([existing] if existing else []))
        else:
            # Windows: add to PATH (for subprocesses) and add_dll_directory (for Python 3.8+ extension loading)
            existing = os.environ.get('PATH', '')
            os.environ['PATH'] = ';'.join(lib_paths) + ';' + existing
            for p in lib_paths:
                if os.path.isdir(p):
                    os.add_dll_directory(p)

    # Add Python site-packages to import path
    if python_paths:
        sys.path[0:0] = python_paths

    # Check gpod directory health and repair if needed
    for sp in python_paths:
        gpod_dir = os.path.join(sp, 'gpod')
        init_file = os.path.join(gpod_dir, '__init__.py')
        ipod_file = os.path.join(gpod_dir, 'ipod.py')
        if os.path.isdir(gpod_dir) and not os.path.isfile(ipod_file):
            print(f"Warning: gpod directory at {gpod_dir} does not contain Python files")
            print(f"  Contents: {os.listdir(gpod_dir)}")
            print(f"  The release may have been packaged incorrectly.")
            print(f"  Try re-downloading or building from source.")
        elif os.path.isdir(gpod_dir) and os.path.isfile(ipod_file) and not os.path.isfile(init_file):
            print(f"Repairing missing gpod/__init__.py at {gpod_dir}")
            with open(init_file, 'w') as f:
                f.write('from .gpod import *\nfrom .ipod import *\n')


def check_libgpod_bindings():
    """Check if libgpod Python bindings can be loaded and print diagnostics if not."""
    try:
        import gpod
        if not hasattr(gpod, 'Database'):
            raise ImportError("gpod loaded but Database class missing (partial import)")
        return
    except ImportError as e:
        # Clean stale partial module from sys.modules so later imports retry from scratch
        for key in list(sys.modules.keys()):
            if key == 'gpod' or key.startswith('gpod.'):
                del sys.modules[key]
        import os
        print(f"Warning: libgpod Python bindings not available ({e})")
        print(f"  Running Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")

        script_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(script_dir)

        # Show what gpod directories exist on disk
        found_any = False
        found_versions = []
        search_base = os.path.join(parent_dir, 'mingw64', 'lib') if sys.platform == 'win32' \
            else os.path.join(parent_dir, 'usr', 'local', 'lib')
        if os.path.isdir(search_base):
            for entry in sorted(os.listdir(search_base)):
                if entry.startswith('python'):
                    gpod_dir = os.path.join(search_base, entry, 'site-packages', 'gpod')
                    if os.path.isdir(gpod_dir):
                        print(f"  Found gpod bindings built for {entry} at: {gpod_dir}")
                        found_any = True
                        found_versions.append(entry.replace('python', ''))
        if not found_any:
            print(f"  No gpod bindings found in: {search_base}")

        running = f"{sys.version_info.major}.{sys.version_info.minor}"
        if found_any and running not in found_versions:
            built_for = ', '.join(found_versions)
            print(f"  Hint: Install Python {built_for} to match the bundled bindings,")
            print(f"        or download a build matching your Python {running}.")

        print("  iPod features will be unavailable.")
        print()


def ensure_dependencies():
    """Check for required packages, install if missing."""
    missing = []
    try:
        import flask
    except ImportError:
        missing.append('flask')

    try:
        import flask_socketio
    except ImportError:
        missing.append('flask-socketio')

    try:
        import mutagen
    except ImportError:
        missing.append('mutagen')

    if missing:
        print(f"Installing missing dependencies: {', '.join(missing)}")
        try:
            subprocess.check_call(
                [sys.executable, '-m', 'pip', 'install'] + missing,
                stdout=subprocess.DEVNULL
            )
            print("Dependencies installed successfully.")
        except subprocess.CalledProcessError:
            print("Error: Failed to install dependencies.")
            print(f"Try manually: {sys.executable} -m pip install {' '.join(missing)}")
            sys.exit(1)


def open_browser(port):
    """Open the browser after a short delay to let the server start."""
    import time
    time.sleep(1.5)
    webbrowser.open(f'http://localhost:{port}')


def main():
    check_python_version()
    setup_libgpod_paths()
    ensure_dependencies()
    check_libgpod_bindings()

    # Add parent directory to path so webpod package can be imported
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    port = 5000
    # Check for --port argument
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == '--port' and i < len(sys.argv):
            try:
                port = int(sys.argv[i + 1])
            except (ValueError, IndexError):
                pass

    # Get local IP for network access
    local_ip = None
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    print("=" * 50)
    print("  WebPod - iPod Web Manager")
    print("=" * 50)
    print(f"  Local:   http://localhost:{port}")
    if local_ip:
        print(f"  Network: http://{local_ip}:{port}")
    print("  Press Ctrl+C to stop")
    print("=" * 50)
    print()

    # Open browser in background thread
    threading.Thread(target=open_browser, args=(port,), daemon=True).start()

    from webpod.app import run
    run(port=port)


if __name__ == '__main__':
    main()
