# WARNING! THIS HAS NOT BEEN TESTED!!

I still haven't recieved my iPod yet, so I can't actually test this tool.
I only intend to actively support the iPod Classic Video (5th gen), others supported by libgpod should work but I won't be implementing fixes for issues only impacting other devices.
Feel free to fork it yourself or submit and request with the fixes.

# WebPod - iPod Web Manager

Manage your iPod's music library through a simple web interface.

## Why?

I really just miss the vibe of iTunes 11/12. The album interface was just so pretty.

I have a lot of music and multiple computers. I don't want duplicate libraries taking up space. This way I can save my music on my NAS, and install this on my computers to sync up-to-date libraries at any time from any computer at home.

--------------------------------------------------------------------------

## Features
None of the "iPod" centric features have not been tested.

### Core Functionality
- **iTunes-Free iPod Syncing** - Manage and sync your music library to classic iPods without requiring iTunes
- **Web-Based Interface** - Access your music library through a browser with a Python backend
- **Automatic Library Scanning** - Automatically searches for music files when settings are saved

### Music Playback
- **Browser-Based Music Player** - Play songs directly in the browser by double-clicking
- **Mini Player Mode** - Optional compact player controls for a streamlined interface
- **Responsive Player Design** - Song names scroll when overflowing the player width

### Library Management
- **Multi-Format Support** - Compatible with M4A, MP3, WAV, FLAC/ALAC, and video files
- **Format Conversion** - Automatically convert FLAC files to ALAC or MP3 formats
- **DRM Flag Handling** - Fixed M4A playback issues caused by DRM flags
- **Metadata Filtering** - Option to include or exclude songs without metadata (with separate podcast handling)
- **Advanced Search** - Search by format and other criteria with "Show All" functionality
- **Export Capability** - Extract and export songs from your iPod back to your computer

### User Interface
- **iTunes 11-Inspired Album View** - Colorful, nostalgic album grid layout reminiscent of classic iTunes
- **Compact & Expanded Views** - Toggle between compact album view or expanded view showing more songs per album
- **Light & Dark Themes** - Choose between light and dark color schemes
- **Colorful Mode** - Accent colors for albums similar to iTunes 11's aesthetic
- **Customizable Accent Colors** - Personalize the interface with your preferred accent color

### iPod Management
- **Redesigned iPod Section** - Streamlined interface for managing connected iPods
- **iPod Icon Support** - Visual iPod model identification (framework in place)
- **Remote Upload** - Upload and add music to iPods from non-host devices through the web interface

### Settings & Customization
- **Organized Settings Panel** - Redesigned, grouped settings for easier navigation
- **Setting Descriptions** - Helpful explanations for each configuration option
- **Notification Controls** - Option to disable toast notifications
- **Improved Save Functionality** - Enhanced settings save behavior

---------------------------------------------------------------------------

## Quick Start

### 1. Download

Go to [Releases](../../releases) and download the file for your system:

| Your Computer | Download |
|---------------|----------|
| Windows | `libgpod-windows-x86_64-py3.12.tar.gz` |
| Mac (M Series) | `libgpod-macos-arm64-py3.12.tar.gz` |
| Mac (Intel) | `libgpod-macos-x86_64-py3.12.tar.gz` |
| Linux (Ubuntu 24.04) | `libgpod-linux-x86_64-py3.12.tar.gz` |
| Linux (Ubuntu 22.04) | `libgpod-linux-x86_64-py3.10.tar.gz` |

### 2. Extract

**Windows:** Right-click the file → Extract All

**Mac:** Double-click the file

**Linux:** Double-click the file, or run `tar -xzf libgpod-*.tar.gz`

### 3. Run WebPod

Open a terminal/command prompt in the extracted folder and run:

```
python webpod/run.py
```

Your browser will open automatically to http://localhost:5000

### 4. Connect Your iPod

1. Plug in your iPod
2. Wait for it to appear in your file manager
3. Click "Detect iPod" in WebPod
4. Select your iPod and start managing your music!

---

## Troubleshooting

**"python" not found**
- Download Python from https://python.org
- Windows: Make sure to check "Add Python to PATH" during installation

**iPod not detected**
- Make sure your iPod shows up in File Explorer / Finder first
- Try unplugging and reconnecting

**Linux: Permission denied**
- Add yourself to the plugdev group: `sudo usermod -a -G plugdev $USER`
- Log out and back in

---

## For Developers

### About libgpod

libgpod is a library for reading and writing the iTunes database on iPods. It supports:
- All "classic" iPod models, iPod Nano, iPod Mini
- iPhone and iPod Touch (partial - requires iTunes-initialized database)
- Cover art and photos
- Playlists and track metadata

I have applied bug fixes, and made minor modifications to the original libgpod. No additions to the 16 year old tool have been made.

### Building from Source

```bash
# Install dependencies (Ubuntu)
sudo apt-get install libglib2.0-dev libsqlite3-dev libplist-dev \
    libgdk-pixbuf-2.0-dev libxml2-dev swig python3-dev

# Build
autoreconf -fi
./configure --with-python
make
make install
```

### Python API Example

```python
import gpod

# Open iPod database
db = gpod.Database('/path/to/ipod/mount')

# List all tracks
for track in db:
    print(f"{track.artist} - {track.title}")

# Add a track
track = db.new_Track()
track.copy_to_ipod('/path/to/song.mp3')
db.copy_delayed_files()
db.close()
```

### Documentation

- [README.overview](README.overview) - Architecture overview
- [README.SysInfo](README.SysInfo) - Device information
- [README.sqlite](README.sqlite) - SQLite database format

---

## License

libgpod is licensed under the LGPL. See COPYING for details.

## Credits

Originally part of [gtkpod](http://www.gtkpod.org). WebPod interface added for modern web-based iPod management.
