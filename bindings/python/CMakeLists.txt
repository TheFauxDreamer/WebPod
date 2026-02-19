find_package(Python3 REQUIRED COMPONENTS Interpreter Development)
find_package(SWIG REQUIRED)
include(UseSWIG)

# Generate gpod.i from gpod.i.in via configure_file
# The .i.in uses @top_builddir@, @top_srcdir@, and version variables
set(top_builddir ${CMAKE_BINARY_DIR})
set(top_srcdir ${CMAKE_SOURCE_DIR})
configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/gpod.i.in
    ${CMAKE_CURRENT_BINARY_DIR}/gpod.i
    @ONLY
)

# Copy gpod_doc.i.in as gpod_doc.i (the xsltproc step is optional and rarely used)
configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/gpod_doc.i.in
    ${CMAKE_CURRENT_BINARY_DIR}/gpod_doc.i
    COPYONLY
)

# Configure SWIG source properties
set_source_files_properties(${CMAKE_CURRENT_BINARY_DIR}/gpod.i PROPERTIES
    CPLUSPLUS OFF
    SWIG_MODULE_NAME gpod
    GENERATED TRUE
    USE_TARGET_INCLUDE_DIRECTORIES TRUE
)

# Build the SWIG Python extension
swig_add_library(_gpod
    TYPE MODULE
    LANGUAGE python
    OUTPUT_DIR ${CMAKE_CURRENT_BINARY_DIR}
    OUTFILE_DIR ${CMAKE_CURRENT_BINARY_DIR}
    SOURCES ${CMAKE_CURRENT_BINARY_DIR}/gpod.i
)

target_include_directories(_gpod PRIVATE
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_BINARY_DIR}
    ${Python3_INCLUDE_DIRS}
)

target_link_libraries(_gpod PRIVATE
    gpod
    PkgConfig::GLIB2
    PkgConfig::GOBJECT2
)

target_compile_options(_gpod PRIVATE -fno-strict-aliasing)
target_compile_definitions(_gpod PRIVATE HAVE_CONFIG_H)

# On macOS, Python extensions should not link libpython
if(APPLE)
    set_target_properties(_gpod PROPERTIES LINK_FLAGS "-undefined dynamic_lookup")
else()
    target_link_libraries(_gpod PRIVATE ${Python3_LIBRARIES})
endif()

# Set correct output name (SWIG already prefixes with _)
set_target_properties(_gpod PROPERTIES
    PREFIX ""
    OUTPUT_NAME "_gpod"
)

# On Windows, use .pyd extension
if(WIN32)
    set_target_properties(_gpod PROPERTIES SUFFIX ".pyd")
endif()

# Install the gpod Python package
# Determine site-packages path
execute_process(
    COMMAND ${Python3_EXECUTABLE} -c
        "import sysconfig; print(sysconfig.get_path('purelib'))"
    OUTPUT_VARIABLE PYTHON_SITE_PACKAGES
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

install(TARGETS _gpod DESTINATION ${PYTHON_SITE_PACKAGES}/gpod)
install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/gpod.py
    ${CMAKE_CURRENT_SOURCE_DIR}/__init__.py
    ${CMAKE_CURRENT_SOURCE_DIR}/ipod.py
    ${CMAKE_CURRENT_SOURCE_DIR}/gtkpod.py
    DESTINATION ${PYTHON_SITE_PACKAGES}/gpod
)
