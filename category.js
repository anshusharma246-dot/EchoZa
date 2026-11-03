const categoryAudio = new Audio();
const CURRENT_USER_KEY = "echoza-current-user";
const categoryState = {
    songs: [],
    visibleSongs: [],
    currentSongId: null,
    isPlaying: false
};

const categorySongGrid = document.getElementById("categorySongGrid");
const categoryTitle = document.getElementById("categoryTitle");
const categoryDescription = document.getElementById("categoryDescription");
const resultHeading = document.getElementById("resultHeading");
const categorySearchInput = document.getElementById("categorySearchInput");
const currentSongTitle = document.getElementById("currentSongTitle");
const currentSongArtist = document.getElementById("currentSongArtist");
const playerCover = document.getElementById("playerCover");
const playIcon = document.getElementById("playIcon");
const progress = document.getElementById("progress");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");

document.addEventListener("DOMContentLoaded", async () => {
    if (!localStorage.getItem(CURRENT_USER_KEY)) {
        window.location.href = "music.html";
        return;
    }
    wireCategoryEvents();
    await loadCategoryLibrary();
});

function wireCategoryEvents() {
    document.getElementById("playPauseBtn").addEventListener("click", togglePlay);
    document.getElementById("prevBtn").addEventListener("click", playPrevious);
    document.getElementById("nextBtn").addEventListener("click", playNext);
    document.getElementById("openCategoryBtn").addEventListener("click", openFromInput);
    categorySearchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            openFromInput();
        }
    });

    categoryAudio.addEventListener("timeupdate", updateProgress);
    categoryAudio.addEventListener("ended", playNext);
    categoryAudio.addEventListener("loadedmetadata", updateProgress);
    document.getElementById("progressBar").addEventListener("click", (event) => {
        if (!categoryAudio.duration) {
            return;
        }
        const width = event.currentTarget.clientWidth;
        categoryAudio.currentTime = (event.offsetX / width) * categoryAudio.duration;
    });
}

async function loadCategoryLibrary() {
    let rawSongs = Array.isArray(window.ECHOZA_LIBRARY) ? window.ECHOZA_LIBRARY : null;
    if (!rawSongs) {
        const response = await fetch("./songs/library.json");
        rawSongs = await response.json();
    }

    categoryState.songs = rawSongs.map((song, index) => decorateSong(song, index));
    renderCategoryPage(getQueryValue());
}

function getQueryValue() {
    const params = new URLSearchParams(window.location.search);
    return params.get("query") || "all songs";
}

function renderCategoryPage(query) {
    const trimmedQuery = query.trim();
    categorySearchInput.value = trimmedQuery;
    const result = filterByQuery(trimmedQuery);
    categoryState.visibleSongs = result.songs;
    categoryTitle.textContent = result.heading;
    categoryDescription.textContent = result.description;
    resultHeading.textContent = result.heading;
    renderCategorySongs(result.songs);
}

function filterByQuery(query) {
    const normalized = query.toLowerCase();

    const categoryMatchers = [
        {
            aliases: ["old song", "old songs", "old is gold", "classic"],
            heading: "Old is gold",
            description: "Classic songs collected in one place.",
            match: (song) => song.mood.toLowerCase() === "classic" || song.section.toLowerCase() === "old is gold"
        },
        {
            aliases: ["top picks", "top pick"],
            heading: "Top picks",
            description: "The songs EchoZa is highlighting right now.",
            match: (song) => song.section.toLowerCase() === "top picks"
        },
        {
            aliases: ["global hits", "english", "english songs"],
            heading: "Global hits",
            description: "English tracks and global favorites.",
            match: (song) => song.language.toLowerCase() === "english" || song.section.toLowerCase() === "global hits"
        },
        {
            aliases: ["late night soft", "soft", "soft songs"],
            heading: "Late night soft",
            description: "Slower songs for a softer mood.",
            match: (song) => song.mood.toLowerCase() === "soft" || song.section.toLowerCase() === "late night soft"
        },
        {
            aliases: ["pop", "pop songs"],
            heading: "Pop songs",
            description: "High-energy pop tracks from your library.",
            match: (song) => song.mood.toLowerCase() === "pop"
        },
        {
            aliases: ["hindi", "bollywood"],
            heading: "Hindi songs",
            description: "Hindi songs from your EchoZa collection.",
            match: (song) => song.language.toLowerCase() === "hindi"
        },
        {
            aliases: ["punjabi", "punjabi songs"],
            heading: "Punjabi songs",
            description: "Punjabi songs from your collection.",
            match: (song) => song.language.toLowerCase() === "punjabi"
        },
        {
            aliases: ["marathi", "marathi songs"],
            heading: "Marathi songs",
            description: "Marathi songs from your EchoZa collection.",
            match: (song) => song.language.toLowerCase() === "marathi"
        },
        {
            aliases: ["m-wood", "mwood", "marathi hits"],
            heading: "M-Wood",
            description: "Your Marathi section collected in one place.",
            match: (song) => song.section.toLowerCase() === "m-wood"
        }
    ];

    const matchedCategory = categoryMatchers.find((entry) => entry.aliases.includes(normalized));
    if (matchedCategory) {
        return {
            heading: matchedCategory.heading,
            description: matchedCategory.description,
            songs: categoryState.songs.filter(matchedCategory.match)
        };
    }

    return {
        heading: `Results for "${query}"`,
        description: "Matching songs, artists, albums, and sections.",
        songs: categoryState.songs.filter((song) =>
            [song.title, song.artist, song.album, song.language, song.mood, song.section]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(normalized))
        )
    };
}

function renderCategorySongs(songList) {
    categorySongGrid.innerHTML = "";

    if (!songList.length) {
        categorySongGrid.innerHTML = `<div class="library-empty">No songs found for this category.</div>`;
        return;
    }

    songList.forEach((song) => categorySongGrid.appendChild(createSongCard(song)));
}

function createSongCard(song) {
    const card = document.createElement("article");
    card.className = "song-card";
    card.style.setProperty("--card-gradient", song.palette.gradient);
    card.innerHTML = `
        <div class="song-card-content">
            <div class="song-card-art">
                <img alt="${song.title} cover art">
                <span class="art-badge">${song.language} | ${song.mood}</span>
            </div>
            <h3>${song.title}</h3>
            <p>${song.artist}</p>
            <small>${song.album || song.section}</small>
            <button class="card-play" type="button" aria-label="Play ${song.title}">
                <i class="fas fa-play"></i>
            </button>
        </div>
    `;

    const image = card.querySelector("img");
    applyCoverSource(image, null, song);

    card.addEventListener("click", () => playSong(song.id));
    card.querySelector(".card-play").addEventListener("click", (event) => {
        event.stopPropagation();
        playSong(song.id);
    });
    return card;
}

function playSong(songId) {
    const song = categoryState.songs.find((entry) => entry.id === songId);
    if (!song) {
        return;
    }

    if (categoryState.currentSongId === songId && categoryState.isPlaying) {
        togglePlay();
        return;
    }

    categoryState.currentSongId = songId;
    categoryAudio.src = song.src;
    categoryAudio.play().then(() => {
        categoryState.isPlaying = true;
        updatePlayerUi();
    });
}

function togglePlay() {
    if (!categoryState.currentSongId) {
        const firstSong = categoryState.visibleSongs[0];
        if (firstSong) {
            playSong(firstSong.id);
        }
        return;
    }

    if (categoryState.isPlaying) {
        categoryAudio.pause();
        categoryState.isPlaying = false;
    } else {
        categoryAudio.play();
        categoryState.isPlaying = true;
    }
    updatePlayerUi();
}

function playNext() {
    if (!categoryState.visibleSongs.length) {
        return;
    }
    const index = categoryState.visibleSongs.findIndex((song) => song.id === categoryState.currentSongId);
    const nextSong = categoryState.visibleSongs[(index + 1 + categoryState.visibleSongs.length) % categoryState.visibleSongs.length];
    playSong(nextSong.id);
}

function playPrevious() {
    if (!categoryState.visibleSongs.length) {
        return;
    }
    const index = categoryState.visibleSongs.findIndex((song) => song.id === categoryState.currentSongId);
    const previousSong = categoryState.visibleSongs[(index - 1 + categoryState.visibleSongs.length) % categoryState.visibleSongs.length];
    playSong(previousSong.id);
}

function updatePlayerUi() {
    const song = categoryState.songs.find((entry) => entry.id === categoryState.currentSongId);
    playIcon.className = categoryState.isPlaying ? "fas fa-pause" : "fas fa-play";

    if (!song) {
        playerCover.innerHTML = "";
        return;
    }

    currentSongTitle.textContent = song.title;
    currentSongArtist.textContent = song.artist;
    playerCover.style.background = song.palette.gradient;
    playerCover.innerHTML = `<img alt="${song.title} cover">`;
    applyCoverSource(playerCover.querySelector("img"), null, song);
}

function updateProgress() {
    if (!categoryAudio.duration) {
        currentTime.textContent = "0:00";
        totalTime.textContent = "0:00";
        progress.style.width = "0%";
        return;
    }

    currentTime.textContent = formatTime(categoryAudio.currentTime);
    totalTime.textContent = formatTime(categoryAudio.duration);
    progress.style.width = `${(categoryAudio.currentTime / categoryAudio.duration) * 100}%`;
}

function openFromInput() {
    const value = categorySearchInput.value.trim();
    if (!value) {
        return;
    }
    window.location.href = `category.html?query=${encodeURIComponent(value)}`;
}

function decorateSong(song, index) {
    const fingerprint = hashString(`${song.file}-${song.title}-${index}`);
    const palette = getPalette(fingerprint);
    const generatedCover = buildGeneratedCover({ ...song, palette });
    return {
        ...song,
        palette,
        cover: song.cover || generatedCover,
        generatedCover,
        coverCandidates: buildCoverCandidates(song.id, song.cover)
    };
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60) || 0;
    const secs = Math.floor(seconds % 60) || 0;
    return `${mins}:${String(secs).padStart(2, "0")}`;
}

function hashString(value) {
    return [...value].reduce((hash, char, index) => hash + (char.charCodeAt(0) * (index + 3)), 0);
}

function getPalette(seed) {
    const palettes = [
        ["#f46b45", "#eea849"],
        ["#4776e6", "#8e54e9"],
        ["#11998e", "#38ef7d"],
        ["#fc4a1a", "#f7b733"],
        ["#7f00ff", "#e100ff"],
        ["#00c6ff", "#0072ff"],
        ["#4568dc", "#b06ab3"],
        ["#c94b4b", "#4b134f"],
        ["#141e30", "#243b55"],
        ["#2b5876", "#4e4376"],
        ["#ff512f", "#dd2476"],
        ["#16222a", "#3a6073"]
    ];
    const [start, end] = palettes[seed % palettes.length];
    return {
        start,
        end,
        gradient: `linear-gradient(135deg, ${start}, ${end})`
    };
}

function buildCoverCandidates(songId, existingCover) {
    const candidates = [];
    if (existingCover) {
        candidates.push(existingCover);
    }
    ["jpg", "jpeg", "png", "webp"].forEach((extension) => {
        candidates.push(`./songs/covers/${songId}.${extension}`);
    });
    return [...new Set(candidates)];
}

function applyCoverSource(image, badge, song) {
    const candidates = [...song.coverCandidates];
    const fallback = song.generatedCover;

    const tryNext = () => {
        const nextSource = candidates.shift();
        if (!nextSource) {
            image.onerror = null;
            image.src = fallback;
            return;
        }
        image.src = nextSource;
    };

    image.onerror = tryNext;
    image.onload = null;

    tryNext();
}

function buildGeneratedCover(song) {
    const initials = getInitials(song.title);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${song.palette.start}" />
                    <stop offset="100%" stop-color="${song.palette.end}" />
                </linearGradient>
            </defs>
            <rect width="600" height="600" rx="42" fill="url(#g)" />
            <circle cx="470" cy="150" r="120" fill="rgba(255,255,255,0.14)" />
            <circle cx="140" cy="480" r="150" fill="rgba(0,0,0,0.18)" />
            <rect x="56" y="56" width="488" height="488" rx="36" fill="rgba(0,0,0,0.18)" />
            <text x="70" y="350" font-size="150" font-family="Space Grotesk, Arial, sans-serif" font-weight="700" fill="white">${escapeSvg(initials)}</text>
            <text x="70" y="430" font-size="38" font-family="DM Sans, Arial, sans-serif" fill="rgba(255,255,255,0.9)">${escapeSvg(song.title)}</text>
            <text x="70" y="475" font-size="28" font-family="DM Sans, Arial, sans-serif" fill="rgba(255,255,255,0.75)">${escapeSvg(song.artist)}</text>
        </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getInitials(title) {
    return title.split(/\s+/).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
}

function escapeSvg(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
