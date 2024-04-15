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
                const videosWithDurations = videoDetails.map((details, index) => [...details, durations[index]]);
                
                let totalSeconds = 0;
                videosWithDurations.forEach(element => {
                    const duration = element[2];
                    try {
                        const seconds = iso8601DurationToSeconds(duration);
                        totalSeconds += seconds;
                    } catch (error) {
                        console.error('Error converting duration:', error);
                    }
                });

                const timeObj = secondsToTime(totalSeconds);
                const totalDurationElement = document.getElementById('totalDuration');
                totalDurationElement.textContent = `Total Duration: ${timeObj.h} hours, ${timeObj.m} minutes, ${timeObj.s} seconds`;
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    } else {
        console.error('Invalid YouTube Playlist URL');
    }
}
