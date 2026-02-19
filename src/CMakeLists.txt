set(LIBGPOD_SOURCES
    db-artwork-debug.c
    db-artwork-parser.c
    db-artwork-writer.c
    db-image-parser.c
    db-parse-context.c
    itdb_artwork.c
    itdb_chapterdata.c
    itdb_device.c
    itdb_hash58.c
    itdb_hash72.c
    itdb_hashAB.c
    itdb_iphone.c
    itdb_itunesdb.c
    itdb_photoalbum.c
    itdb_playlist.c
    itdb_plist.c
    itdb_sqlite.c
    itdb_sysinfo_extended_parser.c
    itdb_thumb.c
    itdb_track.c
    itdb_tzinfo.c
    itdb_zlib.c
    ithumb-writer.c
    pixmaps.c
    rijndael.c
)

add_library(gpod SHARED ${LIBGPOD_SOURCES})

target_include_directories(gpod
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
    PRIVATE
        ${CMAKE_BINARY_DIR}
)

target_link_libraries(gpod
    PRIVATE
        PkgConfig::GLIB2
        PkgConfig::GOBJECT2
        PkgConfig::GMODULE2
        PkgConfig::SQLITE3
        PkgConfig::LIBPLIST
        ZLIB::ZLIB
        m
)

target_compile_definitions(gpod PRIVATE
    HAVE_CONFIG_H
    LIBGPOD_BLOB_DIR="${LIBGPOD_BLOB_DIR}"
)

if(LIBXML2_FOUND)
    target_link_libraries(gpod PRIVATE PkgConfig::LIBXML2)
endif()

if(GDKPIXBUF_FOUND)
    target_link_libraries(gpod PRIVATE PkgConfig::GDKPIXBUF)
endif()

# SO versioning (libtool 7:1:3 -> SOVERSION = CURRENT - AGE = 4)
set_target_properties(gpod PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION 4
    OUTPUT_NAME gpod
)

# On Windows/MinGW, export all symbols for DLL
if(WIN32)
    set_target_properties(gpod PROPERTIES WINDOWS_EXPORT_ALL_SYMBOLS ON)
endif()

install(TARGETS gpod
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
    ARCHIVE DESTINATION lib
)
install(FILES itdb.h DESTINATION include/gpod-1.0/gpod)
