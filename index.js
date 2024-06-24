const apiKey = 'AIzaSyCfzZiKslnzPfIcbKANAW-5pob7-4bC_wU'; // Replace with your YouTube API key

// Function to extract playlist ID from URL
function getPlaylistId(url) {
    const regex = /[&?]list=([a-zA-Z0-9_-]{18,34})/;
    const match = url.match(regex);
  
    if (match && match[1]) {
        return match[1];
    } else {
        return null; // No match found
    }
}

// Function to convert ISO8601 duration to seconds
function iso8601DurationToSeconds(duration) {
    const matches = duration.match(/PT(\d+)M(\d+)S/);
    if (!matches) {
        throw new Error('Invalid duration format');
    }

    const minutes = parseInt(matches[1]);
    const seconds = parseInt(matches[2]);

    return minutes * 60 + seconds;
}

// Function to convert seconds to hours, minutes, seconds
function secondsToTime(secs) {
    var hours = Math.floor(secs / (60 * 60));
    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);
    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);
   
    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}

// Function to fetch playlist data
function fetchPlaylistData() {
    const inputField = document.getElementById('playlistInput');
    const playlistUrl = inputField.value;
    const playlistId = getPlaylistId(playlistUrl);
    
    if (playlistId) {
        const apiUrl = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=100&playlistId=${playlistId}&key=${apiKey}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const videoIds = data.items.map(item => item.contentDetails.videoId);
                const videoDetails = data.items.map(item => [
                    item.snippet.thumbnails.high.url,
                    item.snippet.title
                ]);

                const videoDuration = `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;

                return Promise.all([Promise.resolve(videoDetails), fetch(videoDuration)]);
            })
            .then(([videoDetails, response]) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return Promise.all([Promise.resolve(videoDetails), response.json()]);
            })
            .then(([videoDetails, data]) => {
                const durations = data.items.map(item => item.contentDetails.duration);
                const videosWithDurations = videoDetails.map((details, index) => {
                    const durationInSeconds = iso8601DurationToSeconds(durations[index]);
                    const timeObj = secondsToTime(durationInSeconds);
                    return [...details, `${timeObj.h}h ${timeObj.m}m ${timeObj.s}s`];
                });

                console.log(videosWithDurations); // Log object for debugging

                let totalSeconds = 0;
                videosWithDurations.forEach(element => {
                    const duration = element[2];
                    const matches = duration.match(/(\d+)h (\d+)m (\d+)s/);
                    if (matches) {
                        const hours = parseInt(matches[1]);
                        const minutes = parseInt(matches[2]);
                        const seconds = parseInt(matches[3]);
                        totalSeconds += hours * 3600 + minutes * 60 + seconds;
                    }
                });

                const timeObj = secondsToTime(totalSeconds);
                const totalDurationElement = document.getElementById('totalDuration');
                totalDurationElement.textContent = `Total Duration: ${timeObj.h} hours, ${timeObj.m} minutes, ${timeObj.s} seconds`;

                // Create and add video details table
                const tableContainer = document.getElementById('tableContainer');
                tableContainer.innerHTML = ''; // Clear existing content

                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.marginTop = '20px';
                table.style.borderCollapse = 'collapse';

                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                const headers = ['', 'Title', 'Duration'];
                headers.forEach(headerText => {
                    const th = document.createElement('th');
                    th.textContent = headerText;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                videosWithDurations.forEach(video => {
                    const row = document.createElement('tr');
                    const thumbnailCell = document.createElement('td');
                    const titleCell = document.createElement('td');
                    const durationCell = document.createElement('td');

                    const thumbnailImg = document.createElement('img');
                    thumbnailImg.src = video[0];
                    thumbnailImg.style.width = '120px';

                    thumbnailCell.appendChild(thumbnailImg);
                    titleCell.textContent = video[1];
                    durationCell.textContent = video[2];

                    row.appendChild(thumbnailCell);
                    row.appendChild(titleCell);
                    row.appendChild(durationCell);

                    tbody.appendChild(row);
                });
                table.appendChild(tbody);

                tableContainer.appendChild(table);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    } else {
        console.error('Invalid YouTube Playlist URL');
    }
}
