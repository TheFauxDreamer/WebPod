/**
 * WebPod - Sync & Progress
 * Manages sync operations and SocketIO progress events
 */
var Sync = {
    syncing: false,
    scanning: false,
    exporting: false,

    /**
     * Start a sync operation
     */
    start: function() {
        if (Sync.syncing) {
            WebPod.toast('Sync already in progress', 'warning');
            return;
        }
        if (!IPod.connected) {
            WebPod.toast('No iPod connected', 'warning');
            return;
        }
        if (IPod.unsupported) {
            WebPod.toast('This iPod model is not supported by libgpod', 'warning');
            return;
        }
        Sync.showPreview();
    },

    /**
     * Fetch sync preview and show the preview dialog
     */
    showPreview: function() {
        WebPod.api('/api/ipod/sync-preview').then(function(data) {
            if (data.track_count === 0) {
                WebPod.toast('Nothing to sync', 'info');
                return;
            }

            // Summary
            var summary = document.getElementById('sync-preview-summary');
            summary.textContent = '';
            var p1 = document.createElement('p');
            p1.textContent = data.track_count + ' track(s) to copy (' + data.total_size_mb + ' MB)';
            var p2 = document.createElement('p');
            p2.textContent = 'iPod free space: ' + data.free_mb + ' MB';
            summary.appendChild(p1);
            summary.appendChild(p2);

            // Warning
            var warning = document.getElementById('sync-preview-warning');
            var confirmBtn = document.getElementById('sync-preview-confirm');
            if (!data.will_fit) {
                warning.classList.remove('hidden');
                confirmBtn.disabled = true;
            } else {
                warning.classList.add('hidden');
                confirmBtn.disabled = false;
            }

            // Build track list table
            var container = document.getElementById('sync-preview-tracks');
            container.textContent = '';
            var table = document.createElement('table');
            table.className = 'tracks-table';
            var thead = document.createElement('thead');
            var headerRow = document.createElement('tr');
            ['Title', 'Artist', 'Album', 'Size'].forEach(function(label) {
                var th = document.createElement('th');
                th.textContent = label;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            var tbody = document.createElement('tbody');
            data.pending_tracks.forEach(function(t) {
                var tr = document.createElement('tr');
                var tdTitle = document.createElement('td');
                tdTitle.textContent = t.title;
                var tdArtist = document.createElement('td');
                tdArtist.textContent = t.artist;
                var tdAlbum = document.createElement('td');
                tdAlbum.textContent = t.album;
                var tdSize = document.createElement('td');
                tdSize.textContent = (t.size_bytes / (1024 * 1024)).toFixed(1) + ' MB';
                tr.appendChild(tdTitle);
                tr.appendChild(tdArtist);
                tr.appendChild(tdAlbum);
                tr.appendChild(tdSize);
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);

            document.getElementById('sync-preview-dialog').classList.remove('hidden');
        }).catch(function(err) {
            WebPod.toast('Failed to load sync preview', 'error');
        });
    },

    /**
     * Confirm and execute the sync after preview
     */
    confirmSync: function() {
        document.getElementById('sync-preview-dialog').classList.add('hidden');

        Sync.syncing = true;
        Sync.showProgress('Syncing...', 0);

        var syncBtn = document.getElementById('sync-btn');
        syncBtn.disabled = true;
        syncBtn.classList.remove('btn-pulse');

        WebPod.api('/api/ipod/sync', { method: 'POST' })
            .then(function() {
                WebPod.toast('Sync started', 'info');
            })
            .catch(function() {
                Sync.syncing = false;
                Sync.hideProgress();
                syncBtn.disabled = false;
            });
    },

    /**
     * Show the progress bar
     */
    showProgress: function(text, percent) {
        var container = document.getElementById('progress-container');
        var bar = document.getElementById('progress-bar');
        var fill = document.getElementById('progress-fill');
        var progressText = document.getElementById('progress-text');

        container.classList.remove('hidden');
        if (fill) fill.style.width = (percent || 0) + '%';
        if (progressText) progressText.textContent = text || '';
    },

    /**
     * Hide the progress bar
     */
    hideProgress: function() {
        var container = document.getElementById('progress-container');
        container.classList.add('hidden');
    },

    /**
     * Initialize SocketIO event listeners and sync button
     */
    init: function() {
        // Sync button
        document.getElementById('sync-btn').addEventListener('click', function() {
            Sync.start();
        });

        // Sync preview dialog buttons
        document.getElementById('sync-preview-confirm').addEventListener('click', function() {
            Sync.confirmSync();
        });
        document.getElementById('sync-preview-cancel').addEventListener('click', function() {
            document.getElementById('sync-preview-dialog').classList.add('hidden');
        });

        // Wait for socket to be available, then bind events
        var bindEvents = function() {
            if (!WebPod.socket) {
                setTimeout(bindEvents, 100);
                return;
            }

            // Sync progress
            WebPod.socket.on('sync_progress', function(data) {
                var copied = data.copied || 0;
                var total = data.total || 1;
                var percent = Math.round((copied / total) * 100);
                var track = data.track || '';
                var text = 'Syncing: ' + copied + '/' + total;
                if (track) text += ' - ' + track;
                Sync.showProgress(text, percent);
            });

            // Sync complete
            WebPod.socket.on('sync_complete', function(data) {
                Sync.syncing = false;
                Sync.hideProgress();

                if (data.success) {
                    WebPod.toast('Sync complete', 'success');
                } else {
                    WebPod.toast('Sync failed: ' + (data.error || 'unknown error'), 'error');
                }

                var syncBtn = document.getElementById('sync-btn');
                syncBtn.disabled = !IPod.connected || IPod.unsupported;

                // Refresh iPod tracks and playlists
                if (IPod.connected) {
                    IPod.loadTracks();
                    IPod.loadPlaylists();
                }
            });

            // Scan progress
            WebPod.socket.on('scan_progress', function(data) {
                Sync.scanning = true;
                var scanned = data.scanned || 0;
                var total = data.total || 1;
                var percent = Math.round((scanned / total) * 100);
                var file = data.current_file || '';
                var text = 'Scanning: ' + scanned + '/' + total;
                if (file) {
                    // Show just the filename, not full path
                    var parts = file.split('/');
                    text += ' - ' + parts[parts.length - 1];
                }
                Sync.showProgress(text, percent);

                // Add tooltip to show full text on hover
                var progressText = document.getElementById('progress-text');
                if (progressText) {
                    progressText.title = text;
                }
            });

            // Scan complete
            WebPod.socket.on('scan_complete', function(data) {
                Sync.scanning = false;
                Sync.hideProgress();

                var total = data.total_tracks || 0;
                WebPod.toast('Scan complete: ' + total + ' tracks found', 'success');

                // Re-enable scan button
                var scanBtn = document.getElementById('scan-btn');
                if (scanBtn) {
                    scanBtn.disabled = false;
                    scanBtn.textContent = 'Scan Library';
                }

                // Refresh the current library view
                if (WebPod.currentView === 'albums') {
                    Library.loadAlbums();
                } else if (WebPod.currentView === 'tracks') {
                    Library.loadTracks();
                }
            });

            // Export progress
            WebPod.socket.on('export_progress', function(data) {
                Sync.exporting = true;
                var exported = data.exported || 0;
                var total = data.total || 1;
                var percent = Math.round((exported / total) * 100);
                var track = data.track || '';
                var text = 'Exporting: ' + exported + '/' + total;
                if (track) text += ' - ' + track;
                Sync.showProgress(text, percent);
            });

            // Export complete
            WebPod.socket.on('export_complete', function(data) {
                Sync.exporting = false;
                Sync.hideProgress();

                var msg = 'Export complete: ' + data.exported + ' tracks exported';
                if (data.skipped > 0) msg += ', ' + data.skipped + ' skipped';
                if (data.errors > 0) msg += ', ' + data.errors + ' errors';
                WebPod.toast(msg, 'success');
            });

            // Export error
            WebPod.socket.on('export_error', function(data) {
                Sync.exporting = false;
                Sync.hideProgress();
                WebPod.toast('Export error: ' + data.message, 'error');
            });
        };

        bindEvents();
    }
};

document.addEventListener('DOMContentLoaded', Sync.init);
