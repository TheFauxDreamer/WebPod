cmake_minimum_required(VERSION 3.20)
project(libgpod VERSION 0.8.0 LANGUAGES C)

# Version components for SWIG interface substitution
set(LIBGPOD_MAJOR_VERSION ${PROJECT_VERSION_MAJOR})
set(LIBGPOD_MINOR_VERSION ${PROJECT_VERSION_MINOR})
set(LIBGPOD_MICRO_VERSION ${PROJECT_VERSION_PATCH})

# Options for optional features
option(ENABLE_LIBXML "Enable SysInfoExtended parsing via libxml2" ON)
option(ENABLE_GDKPIXBUF "Enable artwork support via gdk-pixbuf" ON)

# Find required dependencies via pkg-config
find_package(PkgConfig REQUIRED)
pkg_check_modules(GLIB2 REQUIRED IMPORTED_TARGET glib-2.0>=2.16.0)
pkg_check_modules(GOBJECT2 REQUIRED IMPORTED_TARGET gobject-2.0)
pkg_check_modules(GMODULE2 REQUIRED IMPORTED_TARGET gmodule-2.0)
pkg_check_modules(SQLITE3 REQUIRED IMPORTED_TARGET sqlite3)
pkg_check_modules(LIBPLIST REQUIRED IMPORTED_TARGET libplist-2.0)
find_package(ZLIB REQUIRED)

# Optional dependencies
if(ENABLE_LIBXML)
    pkg_check_modules(LIBXML2 IMPORTED_TARGET libxml-2.0)
    if(NOT LIBXML2_FOUND)
        message(WARNING "libxml2 not found -- SysInfoExtended parsing disabled")
    endif()
endif()

if(ENABLE_GDKPIXBUF)
    pkg_check_modules(GDKPIXBUF IMPORTED_TARGET gdk-pixbuf-2.0>=2.6.0)
    if(NOT GDKPIXBUF_FOUND)
        message(WARNING "gdk-pixbuf not found -- artwork support disabled")
    endif()
endif()

# Platform feature checks
include(CheckFunctionExists)
include(CheckStructHasMember)
check_function_exists(localtime_r HAVE_LOCALTIME_R)
check_struct_has_member("struct tm" tm_gmtoff "time.h" HAVE_STRUCT_TM_TM_GMTOFF)

# Set feature flags for config.h
set(HAVE_ZLIB 1)
if(LIBXML2_FOUND)
    set(HAVE_LIBXML 1)
endif()
if(GDKPIXBUF_FOUND)
    set(HAVE_GDKPIXBUF 1)
endif()

# Library blob directory (for hashAB plugin loading)
if(NOT DEFINED LIBGPOD_BLOB_DIR)
    set(LIBGPOD_BLOB_DIR "${CMAKE_INSTALL_PREFIX}/lib/libgpod")
endif()

# Generate config.h
configure_file(cmake/config.h.cmake ${CMAKE_BINARY_DIR}/config.h)

add_subdirectory(src)
add_subdirectory(bindings/python)
