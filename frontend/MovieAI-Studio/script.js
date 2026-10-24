const SUPABASE_URL = "https://pmaktenhccpkovasktng.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vsnuOHOVnNYyPMWeosz_Ww_TKk20xkM";
const movieSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);
let editingSceneIndex = null;
let editingCharacterIndex = null;
let movieProject = {
    title: "",
    idea: "",
    genre: "",
    type: "",
    length: "",
    style: "",
    characters: [],
    characterDraft: {
        name: "",
        role: "Main Protagonist",
        age: "",
        personality: "",
        appearance: "",
        description: ""
    },
scenes: [],
sceneDraft: {
    title: "",
    location: "",
    time: "Morning",
    characters: "",
    action: "",
    dialogue: "",
    camera: ""
},
production: [],
    script: {
        outline: "",
        act1: "",
        act2: "",
        act3: "",
        screenplay: ""
    }
};
const savedMovieProject = localStorage.getItem("movieProject");
if (savedMovieProject) {
    movieProject = JSON.parse(savedMovieProject);
}
if (!movieProject.characterDraft) {
    movieProject.characterDraft = {
        name: "",
        role: "Main Protagonist",
        age: "",
        personality: "",
        appearance: "",
        description: ""
    };
}
if (!movieProject.sceneDraft) {
    movieProject.sceneDraft = {
        title: "",
        location: "",
        time: "Morning",
        characters: "",
        action: "",
        dialogue: "",
        camera: ""
    };
}
function getSavedMovieProjects() {
    try {
        const savedProjects =
            localStorage.getItem("movieProjects");
        const projects = savedProjects
            ? JSON.parse(savedProjects)
            : [];
        return Array.isArray(projects) ? projects : [];
    } catch (error) {
        console.error(
            "Could not load Movie Library:",
            error
        );
        return [];
    }
}
function showMovieLibrary() {
    const projects = getSavedMovieProjects();
    document.querySelector(".hero").innerHTML = `
        <h2>🎬 My Movie Library</h2>
        <p>Choose a saved movie to continue working.</p>
        <button id="createLibraryMovieBtn">
            ➕ Create New Movie
        </button>
        <div id="movieLibraryList"></div>
    `;
    const libraryList =
        document.getElementById("movieLibraryList");
    if (projects.length === 0) {
        libraryList.innerHTML = `
            <p>No saved movies yet. Create your first movie!</p>
        `;
    } else {
        projects.forEach(function(project) {
            const card = document.createElement("div");
            card.className = "movie-library-card";
            const title = document.createElement("h3");
            title.textContent =
                project.title || "Untitled Movie";
            const idea = document.createElement("p");
            idea.textContent =
                project.idea || "No movie description yet.";
            const openButton = document.createElement("button");
            openButton.textContent = "▶️ Open Movie";
openButton.addEventListener("click", function() {
    // Load the selected movie.
    movieProject = project;
    // Restore this movie's saved stage.
    savedStage = project.stage || "movieCreator";
    localStorage.setItem(
        "movieStage",
        savedStage
    );
    // Restore this movie's saved scene number.
    if (project.sceneNumber) {
        localStorage.setItem(
            "movieSceneNumber",
            String(project.sceneNumber)
        );
    } else {
        localStorage.removeItem("movieSceneNumber");
    }
    // Mark this movie as the active project.
    localStorage.setItem(
        "activeMovieProjectId",
        project.id
    );
    localStorage.setItem(
        "movieProject",
        JSON.stringify(movieProject)
    );
    showResumeChoice();
});
            card.appendChild(title);
            card.appendChild(idea);
            card.appendChild(openButton);
            libraryList.appendChild(card);
        });
    }
    document
        .getElementById("createLibraryMovieBtn")
        .addEventListener("click", function() {
            movieProject = {
                id: "movie_" + Date.now() + "_" +
                    Math.random().toString(36).slice(2, 8),
                title: "",
                idea: "",
                genre: "",
                type: "",
                length: "",
                style: "",
                characters: [],
                characterDraft: {
                    name: "",
                    role: "Main Protagonist",
                    age: "",
                    personality: "",
                    appearance: "",
                    description: ""
                },
                scenes: [],
                sceneDraft: {
                    title: "",
                    location: "",
                    time: "Morning",
                    characters: "",
                    action: "",
                    dialogue: "",
                    camera: ""
                },
                production: [],
                script: {
                    outline: "",
                    act1: "",
                    act2: "",
                    act3: "",
                    screenplay: ""
                }
            };
            savedStage = "movieCreator";
            localStorage.setItem(
                "movieStage",
                "movieCreator"
            );
            localStorage.removeItem("movieSceneNumber");
            autoSaveMovie();
            showMovieCreator();
        });
}
function autoSaveMovie() {
    // Give every movie its own permanent ID.
    if (!movieProject.id) {
        movieProject.id =
            "movie_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2, 8);
    }
// Save the current studio stage for this movie.
movieProject.stage = savedStage;
localStorage.setItem(
    "movieStage",
    savedStage
);
    const currentSceneNumber =
        localStorage.getItem("movieSceneNumber");
    movieProject.sceneNumber =
        currentSceneNumber
            ? Number(currentSceneNumber)
            : null;
    movieProject.lastUpdated =
        new Date().toISOString();
    // Keep the legacy save for compatibility.
    localStorage.setItem(
        "movieProject",
        JSON.stringify(movieProject)
    );
    // Load the Movie Library.
    const projects = getSavedMovieProjects();
    const projectIndex = projects.findIndex(
        function(project) {
            return project.id === movieProject.id;
        }
    );
    // Add this movie or update only this movie.
    if (projectIndex === -1) {
        projects.push({ ...movieProject });
    } else {
        projects[projectIndex] = {
            ...movieProject
        };
    }
    localStorage.setItem(
        "movieProjects",
        JSON.stringify(projects)
    );
    localStorage.setItem(
        "activeMovieProjectId",
        movieProject.id
    );
}
async function checkMovieStudioSession() {
    try {
        const { data, error } =
            await movieSupabase.auth.getSession();
        if (error) {
            console.error(
                "MovieAI session check failed:",
                error.message
            );
            window.location.replace(
                "https://ai-video-api-02om.onrender.com/"
            );
            return;
        }
        if (data.session) {
            console.log(
                "MovieAI Studio session detected:",
                data.session.user.email
            );
        } else {
            console.log(
                "No active session. Redirecting to sign in."
            );
            window.location.replace(
                "https://ai-video-api-02om.onrender.com/"
            );
        }
    } catch (error) {
        console.error(
            "MovieAI session check failed:",
            error
        );
        window.location.replace(
            "https://ai-video-api-02om.onrender.com/"
        );
    }
}
checkMovieStudioSession();

let savedStage =
    localStorage.getItem("movieStage") || "movieCreator";
const createMovieBtn =
    document.getElementById("createMovieBtn");
createMovieBtn.addEventListener(
    "click",
    startMovieApp
);
function startMovieApp() {
    const projects = getSavedMovieProjects();
    if (projects.length > 0) {
        showMovieLibrary();
        return;
    }
    // Support an older project saved before the Library existed.
    const savedMovie =
        localStorage.getItem("movieProject");
    if (savedMovie) {
        try {
            movieProject = JSON.parse(savedMovie);
            if (!movieProject.sceneDraft) {
                movieProject.sceneDraft = {
                    title: "",
                    location: "",
                    time: "Morning",
                    characters: "",
                    action: "",
                    dialogue: "",
                    camera: ""
                };
            }
            autoSaveMovie();
            showMovieLibrary();
        } catch (error) {
            console.error(
                "Could not load the saved movie:",
                error
            );
            showMovieCreator();
        }
    } else {
        showMovieCreator();
    }
}
function resumeMovieProject() {
    // Read progress from the selected movie.
savedStage =
    movieProject.stage || "movieCreator";
    // Restore this movie's scene number.
    if (movieProject.sceneNumber) {
        localStorage.setItem(
            "movieSceneNumber",
            String(movieProject.sceneNumber)
        );
    } else {
        localStorage.removeItem("movieSceneNumber");
    }
    // Restore the selected movie as the active project.
    localStorage.setItem(
        "activeMovieProjectId",
        movieProject.id
    );
    localStorage.setItem(
        "movieStage",
        savedStage
    );
    localStorage.setItem(
        "movieProject",
        JSON.stringify(movieProject)
    );
    if (savedStage === "characterStudio") {
        showCharacterStudio();
    } else if (savedStage === "sceneStudio") {
        showSceneStudio();
    } else if (savedStage === "storyStudio") {
        showStoryStudio();
    } else if (savedStage === "sceneProduction") {
        if (movieProject.sceneNumber) {
            generateMovieScene(
                Number(movieProject.sceneNumber)
            );
        } else {
            showStoryStudio();
        }
    } else {
        showMovieCreator();
    }
}
function showResumeChoice() {
    document.querySelector(".hero").innerHTML = `
        <h2>🎬 Welcome Back</h2>
        <p>
            You have an unfinished movie:
            <strong>${movieProject.title || "Untitled Movie"}</strong>
        </p>
        <button id="continueMovieBtn">
            ▶️ Continue Movie
        </button>
        <button id="newMovieBtn">
            ➕ Create New Movie
        </button>
    `;
    document
        .getElementById("continueMovieBtn")
        .addEventListener("click", function() {
            resumeMovieProject();
        });
    document
        .getElementById("newMovieBtn")
        .addEventListener("click", function() {
// Save the current movie before starting another.
autoSaveMovie();
// Start a separate, empty movie project.
movieProject = {
    id: "movie_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8),
    title: "",
    idea: "",
    genre: "",
    type: "",
    length: "",
    style: "",
    characters: [],
    characterDraft: {
        name: "",
        role: "Main Protagonist",
        age: "",
        personality: "",
        appearance: "",
        description: ""
    },
    scenes: [],
    sceneDraft: {
        title: "",
        location: "",
        time: "Morning",
        characters: "",
        action: "",
        dialogue: "",
        camera: ""
    },
    production: [],
    script: {
        outline: "",
        act1: "",
        act2: "",
        act3: "",
        screenplay: ""
    }
};
savedStage = "movieCreator";
localStorage.setItem("movieStage", "movieCreator");
localStorage.removeItem("movieSceneNumber");
autoSaveMovie();
showMovieCreator();
        });
}
function showMovieCreator() {
    document.querySelector(".hero").innerHTML = `
        <h2>Create Your Movie 🎬</h2>
        <p>Start by describing your movie.</p>
        <label for="movieTitle">Movie Title</label>
        <input
            type="text"
            id="movieTitle"
            placeholder="Enter your movie title"
        >
        <label for="movieIdea">Describe Your Movie</label>
        <textarea
            id="movieIdea"
            placeholder="Describe your movie idea..."
        ></textarea>
        <label for="genre">Genre</label>
        <select id="genre">
            <option value="Action">Action</option>
            <option value="Adventure">Adventure</option>
            <option value="Comedy">Comedy</option>
            <option value="Drama">Drama</option>
            <option value="Horror">Horror</option>
            <option value="Romance">Romance</option>
            <option value="Science Fiction">Science Fiction</option>
            <option value="Thriller">Thriller</option>
        </select>
        <label for="type">Project Type</label>
        <select id="type">
            <option value="Movie">Movie</option>
            <option value="Series">Series</option>
        </select>
        <label for="length">Length</label>
        <select id="length">
            <option value="Short">Short</option>
            <option value="Medium">Medium</option>
            <option value="Long">Long</option>
        </select>
        <label for="style">Visual Style</label>
        <select id="style">
            <option value="Cinematic">Cinematic</option>
            <option value="Realistic">Realistic</option>
            <option value="Animation">Animation</option>
            <option value="Anime">Anime</option>
        </select>
        <button id="continueBtn">
            Continue to Characters 👤
        </button>
    `;
 // Restore saved movie information
    document.getElementById("movieTitle").value =
        movieProject.title || "";
    document.getElementById("movieIdea").value =
        movieProject.idea || "";
    document.getElementById("genre").value =
        movieProject.genre || "Action";
    document.getElementById("type").value =
        movieProject.type || "Movie";
    document.getElementById("length").value =
        movieProject.length || "Short";
    document.getElementById("style").value =
        movieProject.style || "Cinematic";
    document
     // Automatically save movie title while typing
    document
        .getElementById("movieTitle")
        .addEventListener("input", function() {
            movieProject.title = this.value;
            autoSaveMovie();
        });
    // Automatically save movie idea while typing
    document
        .getElementById("movieIdea")
        .addEventListener("input", function() {
            movieProject.idea = this.value;
            autoSaveMovie();
        });
// Automatically save genre
    document
        .getElementById("genre")
        .addEventListener("change", function() {
            movieProject.genre = this.value;
            autoSaveMovie();
        });
    // Automatically save project type
    document
        .getElementById("type")
        .addEventListener("change", function() {
            movieProject.type = this.value;
            autoSaveMovie();
        });
    // Automatically save length
    document
        .getElementById("length")
        .addEventListener("change", function() {
            movieProject.length = this.value;
            autoSaveMovie();
        });
    // Automatically save visual style
    document
        .getElementById("style")
        .addEventListener("change", function() {
            movieProject.style = this.value;
            autoSaveMovie();
        });
     document   
.getElementById("continueBtn")
        .addEventListener("click", saveMovieDetails);
}
function saveMovieDetails() {
    const title =
        document.getElementById("movieTitle").value.trim();
    const idea =
        document.getElementById("movieIdea").value.trim();
    if (title === "" || idea === "") {
        alert("Please enter a movie title and describe your movie.");
        return;
    }
    movieProject.title = title;
    movieProject.idea = idea;
    movieProject.genre = document.getElementById("genre").value;
    movieProject.type = document.getElementById("type").value;
    movieProject.length = document.getElementById("length").value;
movieProject.style =
    document.getElementById("style").value;
// Save the movie's next stage.
localStorage.setItem(
    "movieStage",
    "characterStudio"
);
savedStage = "characterStudio";
autoSaveMovie();
showCharacterStudio();
}
function showCharacterStudio() {
    document.querySelector(".hero").innerHTML = `
        <h2>👤 Character Studio</h2>
<button id="backToMovieCreatorBtn">
    ⬅️ Back to Create Your Movie
</button>
        <p>
            Create the characters that will appear in your movie.
        </p>
        <label for="characterName">
            Character Name
        </label>
        <input
            type="text"
            id="characterName"
            placeholder="Example: Alex"
        >
        <label for="characterRole">
            Character Role
        </label>
        <select id="characterRole">
            <option value="Main Protagonist">
                Main Protagonist
            </option>
            <option value="Supporting Character">
                Supporting Character
            </option>
            <option value="Villain">
                Villain
            </option>
            <option value="Scientist">
                Scientist
            </option>
            <option value="Friend">
                Friend
            </option>
            <option value="Family Member">
                Family Member
            </option>
        </select>
        <label for="characterAge">
            Age
        </label>
        <input
            type="number"
            id="characterAge"
            placeholder="Example: 28"
        >
        <label for="characterPersonality">
            Personality
        </label>
        <input
            type="text"
            id="characterPersonality"
            placeholder="Example: Brave and intelligent"
        >
        <label for="characterAppearance">
            Appearance
        </label>

        <textarea
            id="characterAppearance"
            placeholder="Describe what the character looks like..."
        ></textarea>
        <label for="characterDescription">
            Character Description
        </label>
        <textarea
            id="characterDescription"
            placeholder="Describe the character's background..."
        ></textarea>
        <button id="addCharacterBtn">
            Add Character ➕
        </button>
        <h3>🎭 Your Characters</h3>
        <div id="characterList"></div>
        <button id="continueScenesBtn">
            Continue to Scene Studio 🎞️
        </button>
    `;
document
    .getElementById("backToMovieCreatorBtn")
    .addEventListener("click", function() {
        localStorage.setItem(
            "movieStage",
            "movieCreator"
        );
        savedStage = "movieCreator";
        autoSaveMovie();
        showMovieCreator();
    });
// Restore unfinished character information
if (!movieProject.characterDraft) {
    movieProject.characterDraft = {
        name: "",
        role: "Main Protagonist",
        age: "",
        personality: "",
        appearance: "",
        description: ""
    };
}
    document.getElementById("characterName").value =
        movieProject.characterDraft.name || "";
    document.getElementById("characterRole").value =
        movieProject.characterDraft.role || "Main Protagonist";
    document.getElementById("characterAge").value =
        movieProject.characterDraft.age || "";
    document.getElementById("characterPersonality").value =
        movieProject.characterDraft.personality || "";
    document.getElementById("characterAppearance").value =
        movieProject.characterDraft.appearance || "";
    document.getElementById("characterDescription").value =
        movieProject.characterDraft.description || "";
 // Display characters that were already saved
    displayCharacters();
// Automatically save character information while typing
    document
        .getElementById("characterName")
        .addEventListener("input", function() {
            movieProject.characterDraft.name = this.value;
            autoSaveMovie();
        });
    document
        .getElementById("characterRole")
        .addEventListener("change", function() {
            movieProject.characterDraft.role = this.value;
            autoSaveMovie();
        });
    document
        .getElementById("characterAge")
        .addEventListener("input", function() {
            movieProject.characterDraft.age = this.value;
            autoSaveMovie();
        });
    document
        .getElementById("characterPersonality")
        .addEventListener("input", function() {
            movieProject.characterDraft.personality = this.value;
            autoSaveMovie();
        });
    document
        .getElementById("characterAppearance")
        .addEventListener("input", function() {
            movieProject.characterDraft.appearance = this.value;
            autoSaveMovie();
        });
    document
        .getElementById("characterDescription")
        .addEventListener("input", function() {
            movieProject.characterDraft.description = this.value;
            autoSaveMovie();
        });
    document
        .getElementById("addCharacterBtn")
.addEventListener("click", function() {
    const name =
        document.getElementById("characterName").value.trim();
    if (name === "") {
        alert("Please enter a character name.");
        return;
    }
    const character = {
        name: name,
        role: document.getElementById("characterRole").value,
        age: document.getElementById("characterAge").value,
        personality:
            document.getElementById("characterPersonality").value.trim(),
        appearance:
            document.getElementById("characterAppearance").value.trim(),
        description:
            document.getElementById("characterDescription").value.trim()
    };
    if (editingCharacterIndex !== null) {
        movieProject.characters[editingCharacterIndex] = character;
        editingCharacterIndex = null;
        alert("Character changes saved successfully!");
    } else {
        movieProject.characters.push(character);
        alert("Character added successfully!");
    }
    displayCharacters();
    autoSaveMovie();
    movieProject.characterDraft = {
        name: "",
        role: "Main Protagonist",
        age: "",
        personality: "",
        appearance: "",
        description: ""
    };
    autoSaveMovie();
    document.getElementById("characterName").value = "";
    document.getElementById("characterRole").value = "Main Protagonist";
    document.getElementById("characterAge").value = "";
    document.getElementById("characterPersonality").value = "";
    document.getElementById("characterAppearance").value = "";
    document.getElementById("characterDescription").value = "";
    document.getElementById("addCharacterBtn").textContent =
        "Add Character ➕";
});
    document
        .getElementById("continueScenesBtn")
        .addEventListener("click", function() {
            if (movieProject.characters.length === 0) {
                alert("Please add at least one character.");
                return;
            }
localStorage.setItem(
    "movieStage",
    "sceneStudio"
);
savedStage = "sceneStudio";
autoSaveMovie();
showSceneStudio();
        });
}
function displayCharacters() {
    const characterList =
        document.getElementById("characterList");
    characterList.innerHTML = "";
    movieProject.characters.forEach(function(character, index) {
        characterList.innerHTML += `
            <div class="character">
                <h4>
                    ${index + 1}. ${character.name}
                </h4>
                <p>
                    <strong>Role:</strong>
                    ${character.role}
                </p>
                <p>
                    <strong>Age:</strong>
                    ${character.age || "Not specified"}
                </p>
                <p>
                    <strong>Personality:</strong>
                    ${character.personality || "Not specified"}
                </p>
                <p>
                    <strong>Appearance:</strong>
                    ${character.appearance || "Not specified"}
                </p>
                <p>
                    <strong>Description:</strong>
                    ${character.description || "Not specified"}
                </p>
                <button
                    class="editCharacterBtn"
                    data-index="${index}"
                >
                    ✏️ Edit Character
                </button>
            </div>
        `;
    });
    document.querySelectorAll(".editCharacterBtn").forEach(
        function(button) {
            button.addEventListener("click", function() {
                const index = Number(this.dataset.index);
                const character = movieProject.characters[index];

                if (!character) {
                    alert("Character not found.");
                    return;
                }
                editingCharacterIndex = index;
                document.getElementById("characterName").value =
                    character.name || "";
                document.getElementById("characterRole").value =
                    character.role || "Main Protagonist";
                document.getElementById("characterAge").value =
                    character.age || "";
                document.getElementById("characterPersonality").value =
                    character.personality || "";
                document.getElementById("characterAppearance").value =
                    character.appearance || "";
                document.getElementById("characterDescription").value =
                    character.description || "";
                movieProject.characterDraft = {
                    name: character.name || "",
                    role: character.role || "Main Protagonist",
                    age: character.age || "",
                    personality: character.personality || "",
                    appearance: character.appearance || "",
                    description: character.description || ""
                };
                autoSaveMovie();
                document.getElementById("addCharacterBtn").textContent =
                    "💾 Save Character Changes";
                document.getElementById("characterName").focus();
            });
        }
    );
}
function showSceneStudio() {
    document.querySelector(".hero").innerHTML = `
        <h2>🎞️ Scene Studio</h2>
        <p>
            Build the scenes for your movie.
        </p>
        <label for="sceneTitle">
            Scene Title
        </label>
        <input
            type="text"
            id="sceneTitle"
            placeholder="Example: The Portal"
        >
        <label for="sceneLocation">
            Location
        </label>
        <input
            type="text"
            id="sceneLocation"
            placeholder="Example: Secret Laboratory"
        >
        <label for="sceneTime">
            Time of Day
        </label>
        <select id="sceneTime">
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
        </select>
        <label for="sceneCharacters">
            Characters in Scene
        </label>
        <input
            type="text"
            id="sceneCharacters"
            placeholder="Example: Alex, Maya"
        >
        <label for="sceneAction">
            What Happens?
        </label>
        <textarea
            id="sceneAction"
            placeholder="Describe what happens in this scene..."
        ></textarea>
        <label for="sceneDialogue">
            Dialogue
        </label>
        <textarea
            id="sceneDialogue"
            placeholder="Enter character dialogue..."
        ></textarea>
        <label for="cameraDirection">
            Camera Direction
        </label>
        <textarea
            id="cameraDirection"
            placeholder="Example: Wide cinematic shot of the laboratory."
        ></textarea>
        <button id="addSceneBtn">
            Add Scene ➕
        </button>
<button id="saveSceneChangesBtn">
    💾 Save Changes
</button>
        <h3>🎞️ Your Scenes</h3>
        <div id="sceneList"></div>
<button id="backToCharactersBtn">
    ← Go Back to Characters
</button>
<button id="continueStoryBtn">
    Continue to Story & Script Studio 📝
</button>   
    `;
document
    .getElementById("backToCharactersBtn")
    .addEventListener("click", function() {
        localStorage.setItem(
            "movieStage",
            "characterStudio"
        );
        savedStage = "characterStudio";
        autoSaveMovie();
        showCharacterStudio();
    });
// Restore unfinished scene information
if (!movieProject.sceneDraft) {
    movieProject.sceneDraft = {
        title: "",
        location: "",
        time: "Morning",
        characters: "",
        action: "",
        dialogue: "",
        camera: ""
    };
}
document.getElementById("sceneTitle").value =
    movieProject.sceneDraft.title || "";
document.getElementById("sceneLocation").value =
    movieProject.sceneDraft.location || "";
document.getElementById("sceneTime").value =
    movieProject.sceneDraft.time || "Morning";
document.getElementById("sceneCharacters").value =
    movieProject.sceneDraft.characters || "";
document.getElementById("sceneAction").value =
    movieProject.sceneDraft.action || "";
document.getElementById("sceneDialogue").value =
    movieProject.sceneDraft.dialogue || "";
document.getElementById("cameraDirection").value =
    movieProject.sceneDraft.camera || "";
// Display scenes that were already saved
displayScenes();
// Automatically save scene information while typing
document
    .getElementById("sceneTitle")
    .addEventListener("input", function() {
        movieProject.sceneDraft.title = this.value;
        autoSaveMovie();
    });
document
    .getElementById("sceneLocation")
    .addEventListener("input", function() {
        movieProject.sceneDraft.location = this.value;
        autoSaveMovie();
    });
document
    .getElementById("sceneTime")
    .addEventListener("change", function() {
        movieProject.sceneDraft.time = this.value;
        autoSaveMovie();
    });
document
    .getElementById("sceneCharacters")
    .addEventListener("input", function() {
        movieProject.sceneDraft.characters = this.value;
        autoSaveMovie();
    });
document
    .getElementById("sceneAction")
    .addEventListener("input", function() {
        movieProject.sceneDraft.action = this.value;
        autoSaveMovie();
    });
document
    .getElementById("sceneDialogue")
    .addEventListener("input", function() {
        movieProject.sceneDraft.dialogue = this.value;
        autoSaveMovie();
    });
document
    .getElementById("cameraDirection")
    .addEventListener("input", function() {
        movieProject.sceneDraft.camera = this.value;
        autoSaveMovie();
    });
    document
        .getElementById("addSceneBtn")
        .addEventListener("click", function() {
            const title =
                document.getElementById("sceneTitle").value.trim();
            const action =
                document.getElementById("sceneAction").value.trim();
            if (title === "" || action === "") {
                alert(
                    "Please enter a scene title and describe what happens."
                );
                return;
            }
            const scene = {
                title: title,
                location:
                    document.getElementById("sceneLocation").value.trim(),
                time:
                    document.getElementById("sceneTime").value,
                characters:
                    document.getElementById("sceneCharacters").value.trim(),
                action: action,
                dialogue:
                    document.getElementById("sceneDialogue").value.trim(),
                camera:
                    document.getElementById("cameraDirection").value.trim()
            };
            movieProject.scenes.push(scene);
            displayScenes();
autoSaveMovie();
// Clear the unfinished scene draft
movieProject.sceneDraft = {
    title: "",
    location: "",
    time: "Morning",
    characters: "",
    action: "",
    dialogue: "",
    camera: ""
};
autoSaveMovie();
            document.getElementById("sceneTitle").value = "";
            document.getElementById("sceneLocation").value = "";
            document.getElementById("sceneCharacters").value = "";
            document.getElementById("sceneAction").value = "";
            document.getElementById("sceneDialogue").value = "";
            document.getElementById("cameraDirection").value = "";
        });
document
    .getElementById("saveSceneChangesBtn")
    .addEventListener("click", function() {
        if (editingSceneIndex === null) {
            alert("Please click Edit Scene first.");
            return;
        }
        movieProject.scenes[editingSceneIndex] = {
            title:
                document.getElementById("sceneTitle").value.trim(),
            location:
                document.getElementById("sceneLocation").value.trim(),
            time:
                document.getElementById("sceneTime").value,
            characters:
                document.getElementById("sceneCharacters").value.trim(),
            action:
                document.getElementById("sceneAction").value.trim(),
            dialogue:
                document.getElementById("sceneDialogue").value.trim(),
            camera:
                document.getElementById("cameraDirection").value.trim()
        };
        autoSaveMovie();
        displayScenes();
        editingSceneIndex = null;
        alert("Scene changes saved successfully!");
    });
    document
        .getElementById("continueStoryBtn")
        .addEventListener("click", function() {
            if (movieProject.scenes.length === 0) {
                alert("Please add at least one scene.");
                return;
            }
autoSaveMovie();
localStorage.setItem(
    "movieStage",
    "storyStudio"
);
savedStage = "storyStudio";
autoSaveMovie();
showStoryStudio();
        });
}
function displayScenes() {
    const sceneList =
        document.getElementById("sceneList");
    sceneList.innerHTML = "";
    movieProject.scenes.forEach(function(scene, index) {
        sceneList.innerHTML += `
            <div class="scene">
                <h4>
                    Scene ${index + 1} — ${scene.title}
                </h4>
                <p>
                    <strong>Location:</strong>
                    ${scene.location || "Not specified"}
                </p>
                <p>
                    <strong>Time:</strong>
                    ${scene.time}
                </p>
                <p>
                    <strong>Characters:</strong>
                    ${scene.characters || "Not specified"}
                </p>
                <p>
                    <strong>Action:</strong>
                    ${scene.action}
                </p>
                <p>
                    <strong>Dialogue:</strong>
                    ${scene.dialogue || "No dialogue yet"}
                </p>
<p>
    <strong>Camera:</strong>
    ${scene.camera || "Not specified"}
</p>
<button
    class="deleteSceneBtn"
    data-index="${index}"
>
    🗑️ Delete Scene
</button>
<button
    class="editSceneBtn"
    data-index="${index}"
>
    ✏️ Edit Scene
</button>
</div>
        `;
    });
    document
        .querySelectorAll(".deleteSceneBtn")
        .forEach(function(button) {
button.addEventListener("click", function() {
    const confirmed = confirm(
        "Are you sure you want to delete this scene?"
    );

    if (!confirmed) {
        return;
    }
    const index =
        Number(this.dataset.index);
    editingSceneIndex = index;
    movieProject.scenes.splice(index, 1);
                autoSaveMovie();
                displayScenes();
            });
        });
document
    .querySelectorAll(".editSceneBtn")
    .forEach(function(button) {
        button.addEventListener("click", function() {
            const index =
                Number(this.dataset.index);
editingSceneIndex = index;
            const scene =
                movieProject.scenes[index];
document.getElementById("sceneTitle").value =
    scene.title;
document.getElementById("sceneLocation").value =
    scene.location;
document.getElementById("sceneTime").value =
    scene.time;
document.getElementById("sceneCharacters").value =
    scene.characters;
document.getElementById("sceneAction").value =
    scene.action;
document.getElementById("sceneDialogue").value =
    scene.dialogue;
document.getElementById("cameraDirection").value =
    scene.camera;
        });
    });
}
function showStoryStudio() {
    document.querySelector(".hero").innerHTML = `
        <h2>📝 AI Story & Script Studio</h2>
<button id="backToSceneStudioBtn">
    ⬅️ Back to Scene Studio
</button>
<div id="movieStorySummary"></div>
        <p>
            Turn your movie idea into a complete story structure.
        </p>
        <h3>📖 Story Outline</h3>
        <textarea
            id="storyOutline"
            placeholder="Describe the main story from beginning to end..."
        ></textarea>
        <h3>🎬 Act 1 — The Beginning</h3>
        <textarea
            id="act1"
            placeholder="Describe how the story begins..."
        ></textarea>
        <h3>⚔️ Act 2 — The Conflict</h3>
        <textarea
            id="act2"
            placeholder="Describe the main conflict and challenges..."
        ></textarea>
        <h3>🏁 Act 3 — The Resolution</h3>
        <textarea
            id="act3"
            placeholder="Describe how the story ends..."
        ></textarea>
        <h3>🎭 Screenplay</h3>
        <textarea
            id="screenplay"
            placeholder="Write the screenplay scene by scene..."
        ></textarea>
<button id="generateScriptBtn">
    🤖 Generate AI Screenplay
</button>
<button id="saveStoryBtn">
    Save Story & Script 💾
</button>
<div id="generatedScript"></div>
    `;  
document.getElementById("movieStorySummary").innerHTML = `
    <h3>🎬 Your Movie</h3>
    <p>
        <strong>Title:</strong>
        ${movieProject.title || "Untitled Movie"}
    </p>
    <p>
        <strong>Genre:</strong>
        ${movieProject.genre || "Not specified"}
    </p>
    <h4>👤 Characters</h4>
    ${movieProject.characters.length > 0
        ? movieProject.characters.map(function(character) {
            return `
                <p>
                    <strong>${character.name}</strong>
                    — ${character.role}
                </p>
            `;
        }).join("")
        : "<p>No characters added yet.</p>"
    }
<h4>🎞️ Scenes</h4>
${movieProject.scenes.length > 0
    ? movieProject.scenes.map(function(scene, index) {
        return `
            <div>
                <p>
                    <strong>
                        Scene ${index + 1} — ${scene.title}
                    </strong>
                </p>
                <p>
                    <strong>Location:</strong>
                    ${scene.location || "Not specified"}
                </p>
                <p>
                    <strong>Time:</strong>
                    ${scene.time || "Not specified"}
                </p>
                <p>
                    <strong>Action:</strong>
                    ${scene.action || "Not specified"}
                </p>
            </div>
        `;
    }).join("")
    : "<p>No scenes added yet.</p>"
}
`;
document
    .getElementById("backToSceneStudioBtn")
    .addEventListener("click", function() {
        localStorage.setItem(
            "movieStage",
            "sceneStudio"
        );
        savedStage = "sceneStudio";
        autoSaveMovie();
        showSceneStudio();
    });
// Restore previously saved story and script
document.getElementById("storyOutline").value =
    movieProject.script.outline || "";
document.getElementById("act1").value =
    movieProject.script.act1 || "";
document.getElementById("act2").value =
    movieProject.script.act2 || "";
document.getElementById("act3").value =
    movieProject.script.act3 || "";
document.getElementById("screenplay").value =
    movieProject.script.screenplay || "";
// Automatically save story fields while typing
document.getElementById("storyOutline").addEventListener("input", function() {
 movieProject.script.outline = this.value;
autoSaveMovie();
});
document.getElementById("act1").addEventListener("input", function() {
    movieProject.script.act1 = this.value;
    autoSaveMovie();
});
document.getElementById("act2").addEventListener("input", function() {
    movieProject.script.act2 = this.value;
    autoSaveMovie();
});
document.getElementById("act3").addEventListener("input", function() {
     movieProject.script.act3 = this.value;
autoSaveMovie();
});
document.getElementById("screenplay").addEventListener("input", function() {
    movieProject.script.screenplay = this.value;
    autoSaveMovie();
});
document
    .getElementById("generateScriptBtn")
    .addEventListener("click", generateAIScript);
document
    .getElementById("saveStoryBtn")
    .addEventListener("click", saveStory);
// Restore saved scene buttons when returning to Story & Script Studio.
if (movieProject.script.screenplay && movieProject.script.screenplay.trim() !== "") {
    const scenes = movieProject.scenes || [];
    const scriptContainer = document.getElementById("generatedScript");
    scriptContainer.innerHTML = `
        <div class="scene">
            <h3>🤖 Saved AI-Generated Screenplay</h3>
            <h4>🎬 ${movieProject.title || "Untitled Movie"}</h4>
            <h4>SCENE 1 — ${scenes[0]?.title || "BEGINNING"}</h4>
            <button onclick="generateMovieScene(1)">
                🎬 Generate Movie Scene 1
            </button>
            <h4>SCENE 2 — ${scenes[1]?.title || "CONFLICT"}</h4>
            <button onclick="generateMovieScene(2)">
                🎬 Generate Movie Scene 2
            </button>
            <h4>SCENE 3 — ${scenes[2]?.title || "RESOLUTION"}</h4>
            <button onclick="generateMovieScene(3)">
                🎬 Generate Movie Scene 3
            </button>
        </div>
    `;
}
async function generateAIScript() {
    const outline =
        document.getElementById("storyOutline").value.trim();
    const act1 =
        document.getElementById("act1").value.trim();
    const act2 =
        document.getElementById("act2").value.trim();
    const act3 =
        document.getElementById("act3").value.trim();
    if (outline === "") {
        alert("Please enter your story outline first.");
        return;
    }
// Save the latest story information
    movieProject.script.outline = outline;
    movieProject.script.act1 = act1;
    movieProject.script.act2 = act2;
    movieProject.script.act3 = act3;
// Create real scene records when the screenplay has fewer than three scenes.
    const firstScene = movieProject.scenes[0] || {};
    if (!movieProject.scenes[1]) {
        movieProject.scenes[1] = {
            title: "Conflict",
            location: firstScene.location || "Not specified",
            time: firstScene.time || "Not specified",
            characters: firstScene.characters || "",
            action: act2 || "The main conflict begins.",
            dialogue: "",
            camera: "Cinematic camera movement."
        };
    }
    if (!movieProject.scenes[2]) {
        movieProject.scenes[2] = {
            title: "Resolution",
            location: firstScene.location || "Not specified",
            time: firstScene.time || "Not specified",
            characters: firstScene.characters || "",
            action: act3 || "The story reaches its conclusion.",
            dialogue: "",
            camera: "Cinematic final shot."
        };
    }
autoSaveMovie();
    const scriptContainer =
        document.getElementById("generatedScript");
    try {
       const { data: sessionData, error: sessionError } =
            await movieSupabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (sessionError || !accessToken) {
            alert("Please log in again before generating your screenplay.");
            return;
        }
        const response = await fetch(
            "https://ai-video-api-02om.onrender.com/v1/screenplay",
            {
          method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    title: movieProject.title || "Untitled Movie",
                    idea: movieProject.idea || outline,
                    genre: movieProject.genre || "Drama",
                    movie_type: movieProject.type || "Movie",
                    length: movieProject.length || "Medium",
                    style: movieProject.style || "Cinematic",
                    outline: outline,
                    act1: act1,
                    act2: act2,
                    act3: act3,
                    characters: movieProject.characters || [],
                    scenes: movieProject.scenes || []
                })
            }
        );
        const data = await response.json();
        if (!response.ok) {
            throw new Error(
                data.detail || data.error ||
                "The AI screenplay request failed."
            );
        }
        if (!data.screenplay) {
            throw new Error("No screenplay was returned by the AI.");
        }
        movieProject.script.screenplay = data.screenplay;
        const aiScreenplayText =
    document.getElementById("aiScreenplayText");
if (aiScreenplayText) {
    aiScreenplayText.textContent = data.screenplay;
}
        autoSaveMovie();
        alert("AI screenplay generated and saved successfully!");
    } catch (error) {
        console.error("AI screenplay generation failed:", error);
        alert("AI screenplay generation failed: " + error.message);
        return;
    }
const characters =
    movieProject.characters;
const scenes =
    movieProject.scenes;
    scriptContainer.innerHTML = `
        <div class="scene">
            <h3>🤖 AI-Generated Screenplay</h3>
            <h4>🎬 ${movieProject.title}</h4>
            <p>
                <strong>Genre:</strong>
                ${movieProject.genre}
            </p>
<h4>📝 Complete AI Screenplay</h4>
            <pre id="aiScreenplayText"
                 style="white-space: pre-wrap;"></pre>
            <hr>
<h4>SCENE 1 — ${scenes[0]?.title || "BEGINNING"}</h4>
<p>
    <strong>Location:</strong>
    ${scenes[0]?.location || "Unknown Location"}
</p>
<p>
    <strong>Time:</strong>
    ${scenes[0]?.time || "Not specified"}
</p>
<p>
    <strong>Characters:</strong>
    ${scenes[0]?.characters || "Not specified"}
</p>
<p>
    <strong>Action:</strong>
    ${scenes[0]?.action || act1 || outline}
</p>
<p>
    <strong>Dialogue:</strong>
    ${scenes[0]?.dialogue || "No dialogue written yet."}
</p>
<p>
    <strong>Camera:</strong>
    ${scenes[0]?.camera || "Cinematic establishing shot."}
</p>
<button onclick="generateMovieScene(1)">
    🎬 Generate Movie Scene 1
</button>
<h4>SCENE 2 — ${scenes[1]?.title || "CONFLICT"}</h4>
<p>
    <strong>Location:</strong>
    ${scenes[1]?.location || "Unknown Location"}
</p>
<p>
    <strong>Time:</strong>
    ${scenes[1]?.time || "Not specified"}
</p>
<p>
    <strong>Characters:</strong>
    ${scenes[1]?.characters || "Not specified"}
</p>
<p>
    <strong>Action:</strong>
    ${scenes[1]?.action || act2 || "The main conflict begins."}
</p>
<p>
    <strong>Dialogue:</strong>
    ${scenes[1]?.dialogue || "No dialogue written yet."}
</p>
<p>
    <strong>Camera:</strong>
    ${scenes[1]?.camera || "Cinematic camera movement."}
</p>
<button onclick="generateMovieScene(2)">
    🎬 Generate Movie Scene 2
</button>
<h4>
    SCENE 3 — ${scenes[2]?.title || "RESOLUTION"}
</h4>
<p>
    <strong>Location:</strong>
    ${scenes[2]?.location || "Unknown Location"}
</p>
<p>
    <strong>Time:</strong>
    ${scenes[2]?.time || "Not specified"}
</p>
<p>
    <strong>Characters:</strong>
    ${scenes[2]?.characters || "Not specified"}
</p>
<p>
    <strong>Action:</strong>
    ${scenes[2]?.action || act3 || "The story reaches its conclusion."}
</p>
<p>
    <strong>Dialogue:</strong>
    ${scenes[2]?.dialogue || "No dialogue written yet."}
</p>
<p>
    <strong>Camera:</strong>    ${scenes[2]?.camera || "Cinematic final shot."}
</p>
<button onclick="generateMovieScene(3)">
    🎬 Generate Movie Scene 3
</button>
        </div>
    `;
const aiScreenplayText =
    document.getElementById("aiScreenplayText");
if (aiScreenplayText) {
    aiScreenplayText.textContent =
        movieProject.script.screenplay || "";
}
}
}
function saveStory() {
    movieProject.script.outline =
        document.getElementById("storyOutline").value;
    movieProject.script.act1 =
        document.getElementById("act1").value;
    movieProject.script.act2 =
        document.getElementById("act2").value;
    movieProject.script.act3 =
        document.getElementById("act3").value;
    movieProject.script.screenplay =
        document.getElementById("screenplay").value;
    autoSaveMovie();
    localStorage.setItem(
        "movieStage",
        "storyStudio"
    );
    alert("Story and screenplay saved successfully!");
}
function generateMovieScene(sceneNumber) {
    localStorage.setItem("movieStage", "sceneProduction");
    localStorage.setItem("movieSceneNumber", sceneNumber);
    const scene = movieProject.scenes[sceneNumber - 1];
    if (!scene) {
        alert("This scene doesn't exist.");
        return;
    }
    savedStage = "sceneProduction";
    autoSaveMovie();
// Build consistent character references for this scene.
    const sceneCharacterNames = String(scene.characters || "")
        .split(",")
        .map(function(name) {
            return name.trim().toLowerCase();
        })
        .filter(Boolean);
    const savedCharacters = movieProject.characters || [];
    const matchedCharacters = savedCharacters.filter(
        function(character) {
            const savedName = String(character.name || "")
                .trim()
                .toLowerCase();
            return savedName &&
                sceneCharacterNames.includes(savedName);
        }
    );
    const characterPromptText = matchedCharacters
        .map(function(character) {
            return `${character.name} — ${character.role || "Character"}.
Age: ${character.age || "Use the saved character profile"}.
Appearance: ${character.appearance || "Use the saved character reference"}.
Personality: ${character.personality || "Keep behaviour consistent"}.
IDENTITY CONTINUITY:
Preserve this character's established face, skin tone, age, hairstyle, and defining features across every shot.
COSTUME CONTINUITY:
Keep the outfit consistent within the same scene. Change clothing between scenes only when justified by the story, location, weather, time, damage, or injuries.`;
        })
        .join("\n\n");
    const missingCharacterNames = sceneCharacterNames.filter(
        function(sceneName) {
            return !matchedCharacters.some(function(character) {
                return String(character.name || "")
                    .trim()
                    .toLowerCase() === sceneName;
            });
        }
    );
    const missingCharacterNote = missingCharacterNames.length
        ? `\n\nCHARACTER PROFILES NOT FOUND:\n${missingCharacterNames.join(", ")}. Do not invent their appearance. Add or correct their saved Character Studio profiles to ensure consistent identity.`
        : "";
    const finalCharacterPrompt =
        (characterPromptText ||
            "No matching saved character profiles were found. Check Character Studio.") +
        missingCharacterNote;
    // Build a richer cinematic visual prompt.
    const visualPromptText = `SCENE: ${scene.title || "Untitled Scene"}
LOCATION: ${scene.location || "Not specified"}
TIME: ${scene.time || "Not specified"}
ACTION: ${scene.action || "Action not specified"}
VISUAL STYLE: ${movieProject.style || "Cinematic"}
CHARACTER CONTINUITY:
${finalCharacterPrompt}
CINEMATOGRAPHY:
Use deliberate cinematic framing, clear subject focus, layered foreground and background, believable movement, and shot composition that supports the story.
LIGHTING AND COLOUR:
Use lighting appropriate to the location and time of day. Maintain a consistent colour grade and believable shadows. For cyberpunk scenes, use controlled neon highlights, atmospheric haze and contrasting cool and warm light where appropriate.
WORLD CONTINUITY:
Preserve the established location layout, important props, costumes, weather and time of day. Do not introduce unexplained changes between shots.
QUALITY:
Detailed environments, natural body movement, coherent spatial relationships, stable visual continuity and a polished cinematic finish.
IMPORTANT:
Treat the saved scene and character descriptions as the source of truth. Do not invent conflicting character features or location details.`;
    // Add a camera plan when the scene has no saved camera direction.
    const cameraPromptText = scene.camera ||
        `Cinematic establishing shot of ${scene.location || "the scene location"}, followed by a controlled tracking shot toward the main action. Use close-ups for important expressions, motivated camera movement, consistent screen direction and smooth transitions. Match the camera style to ${movieProject.style || "Cinematic"} visuals.`;
    document.querySelector(".hero").innerHTML = `
        <h2>🎬 Scene Production Studio</h2>
<button id="backToStoryStudioBtn">
    ⬅️ Back to Story & Script Studio
</button>
        <h3>🎞️ Scene ${sceneNumber}: ${scene.title}</h3>
        <p>
            <strong>Location:</strong>
            ${scene.location || "Not specified"}
        </p>
        <p>
            <strong>Time:</strong>
            ${scene.time || "Not specified"}
        </p>
        <p>
            <strong>Characters:</strong>
            ${scene.characters || "Not specified"}
        </p>
<h3>🎭 Characters & Appearance</h3>
<textarea
    id="sceneCharacterPrompt"
    readonly
    placeholder="Describe how the characters should look in this scene..."
>${characterPromptText}</textarea>
<h3>🎥 Visual Description</h3>
<textarea
    id="sceneVisualPrompt"
    readonly
    placeholder="AI-generated visual description for this scene..."
>${visualPromptText}</textarea>
       <h3>📷 Camera Direction</h3>
        <textarea
            id="sceneCameraPrompt"
            readonly
            placeholder="Example: Slow camera movement toward Alex..."
        >${cameraPromptText}</textarea> 
        <h3>💬 Dialogue</h3>
        <textarea
            id="sceneDialoguePrompt"
            readonly
            placeholder="Enter the dialogue for this scene..."
        >${scene.dialogue || ""}</textarea>
        <h3>🎙️ Audio & Music</h3>
        <textarea
            id="sceneAudioPrompt"
            placeholder="Describe voices, sound effects and background music..."
        ></textarea>
        <label for="sceneDuration">
            Scene Duration
        </label>
        <select id="sceneDuration">
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
            <option value="15">15 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">60 seconds</option>
        </select>
<button id="editProductionBtn">
    ✏️ Edit Production Settings
</button>
<button id="prepareSceneBtn">
    🎬 Prepare Scene
</button>
<div id="sceneProductionResult"></div>
    `;
document
    .getElementById("backToStoryStudioBtn")
    .addEventListener("click", function() {
        localStorage.setItem(
            "movieStage",
            "storyStudio"
        );
        savedStage = "storyStudio";
        autoSaveMovie();
        showStoryStudio();
    });
// Restore saved character and audio prompts
const savedProduction = movieProject.production.find(
    item => item.sceneNumber === sceneNumber
);
if (savedProduction) {
document.getElementById("sceneCharacterPrompt").value =
    savedProduction.characterPrompt ||
    document.getElementById("sceneCharacterPrompt").value;
document.getElementById("sceneVisualPrompt").value =
    savedProduction.visualPrompt ||
    document.getElementById("sceneVisualPrompt").value;
   document.getElementById("sceneCameraPrompt").value =
        savedProduction.cameraPrompt || cameraPromptText;
    document.getElementById("sceneDialoguePrompt").value =
        savedProduction.dialoguePrompt || scene.dialogue || "";
    document.getElementById("sceneAudioPrompt").value =
        savedProduction.audioPrompt || "";
}
// Automatically save character appearance while typing
document
    .getElementById("sceneCharacterPrompt")
    .addEventListener("input", function() {
        let production = movieProject.production.find(
            item => item.sceneNumber === sceneNumber
        );
        if (!production) {
            production = {
                sceneNumber: sceneNumber,
                sceneTitle: scene.title,
                characterPrompt: "",
                visualPrompt: "",
                cameraPrompt: "",
                dialoguePrompt: "",
                audioPrompt: "",
                duration: "5"
            };
            movieProject.production.push(production);
        }
        production.characterPrompt = this.value;
        localStorage.setItem(
            "movieProject",
            JSON.stringify(movieProject)
        );
    });
// Automatically save audio while typing
// Automatically save visual description while typing
document
    .getElementById("sceneVisualPrompt")
    .addEventListener("input", function() {
        let production = movieProject.production.find(
            item => item.sceneNumber === sceneNumber
        );
        if (!production) {
            production = {
                sceneNumber: sceneNumber,
                sceneTitle: scene.title,
                characterPrompt: "",
                visualPrompt: "",
                cameraPrompt: "",
                dialoguePrompt: "",
                audioPrompt: "",
                duration: "5"
            };
            movieProject.production.push(production);
        }
        production.visualPrompt = this.value;
        localStorage.setItem(
            "movieProject",
            JSON.stringify(movieProject)
        );
    });
// Automatically save camera direction while typing
document
    .getElementById("sceneCameraPrompt")
    .addEventListener("input", function() {
        let production = movieProject.production.find(
            item => item.sceneNumber === sceneNumber
        );
        if (!production) {
            production = {
                sceneNumber: sceneNumber,
                sceneTitle: scene.title,
                characterPrompt: "",
                visualPrompt: "",
                cameraPrompt: "",
                dialoguePrompt: "",
                audioPrompt: "",
                duration: "5"
            };
            movieProject.production.push(production);
        }
        production.cameraPrompt = this.value;
        localStorage.setItem(
            "movieProject",
            JSON.stringify(movieProject)
        );
    });
// Automatically save dialogue while typing
document
    .getElementById("sceneDialoguePrompt")
    .addEventListener("input", function() {
        let production = movieProject.production.find(
            item => item.sceneNumber === sceneNumber
        );
        if (!production) {
            production = {
                sceneNumber: sceneNumber,
                sceneTitle: scene.title,
                characterPrompt: "",
                visualPrompt: "",
                cameraPrompt: "",
                dialoguePrompt: "",
                audioPrompt: "",
                duration: "5"
            };
            movieProject.production.push(production);
        }
        production.dialoguePrompt = this.value;
        localStorage.setItem(
            "movieProject",
            JSON.stringify(movieProject)
        );
    });
document
    .getElementById("sceneAudioPrompt")
    .addEventListener("input", function() {
        let production = movieProject.production.find(
            item => item.sceneNumber === sceneNumber
        );
        if (!production) {
            production = {
                sceneNumber: sceneNumber,
                sceneTitle: scene.title,
                characterPrompt: "",
                visualPrompt: "",
                cameraPrompt: "",
                dialoguePrompt: "",
                audioPrompt: "",
                duration: "5"
            };
            movieProject.production.push(production);
        }
        production.audioPrompt = this.value;
        localStorage.setItem(
            "movieProject",
            JSON.stringify(movieProject)
        );
    });
document
    .getElementById("editProductionBtn")
    .addEventListener("click", function() {
        document
            .getElementById("sceneCharacterPrompt")
            .removeAttribute("readonly");
        document
            .getElementById("sceneVisualPrompt")
            .removeAttribute("readonly");
        document
            .getElementById("sceneCameraPrompt")
            .removeAttribute("readonly");
        document
            .getElementById("sceneDialoguePrompt")
            .removeAttribute("readonly");
        document
            .getElementById("sceneCharacterPrompt")
            .focus();
        this.textContent =
            "✅ Production Settings Unlocked";
    });
    document
        .getElementById("prepareSceneBtn")
        .addEventListener("click", function() {
            const characterPrompt =
                document
                    .getElementById("sceneCharacterPrompt")
                    .value
                    .trim();
            const visualPrompt =
                document
                    .getElementById("sceneVisualPrompt")
                    .value
                    .trim();
            const cameraPrompt =
                document
                    .getElementById("sceneCameraPrompt")
                    .value
                    .trim();
            const dialoguePrompt =
                document
                    .getElementById("sceneDialoguePrompt")
                    .value
                    .trim();
            const audioPrompt =
                document
                    .getElementById("sceneAudioPrompt")
                    .value
                    .trim();
            const duration =
                document.getElementById("sceneDuration").value;
const productionData = {
    sceneNumber: sceneNumber,
    sceneTitle: scene.title,
    characterPrompt: characterPrompt,
    visualPrompt: visualPrompt,
    cameraPrompt: cameraPrompt,
    dialoguePrompt: dialoguePrompt,
    audioPrompt: audioPrompt,
    duration: duration,
    prepared: true
};
const existingProduction =
    movieProject.production.find(
        item => item.sceneNumber === sceneNumber
    );
if (existingProduction) {
    Object.assign(
        existingProduction,
        productionData
    );
} else {
    movieProject.production.push(
        productionData
    );
}
autoSaveMovie();
            const result =
                document.getElementById("sceneProductionResult");
            result.innerHTML = `
                <div class="scene">
                    <h3>🎬 Scene Ready for Production</h3>
                    <p>
                        <strong>Scene:</strong>
                        ${scene.title}
                    </p>
                    <p>
                        <strong>Duration:</strong>
                        ${duration} seconds
                    </p>
                    <h4>🎭 Character Prompt</h4>
                    <p>
                        ${characterPrompt || "Not specified"}
                    </p>
                    <h4>🎥 Visual Prompt</h4>
                    <p>
                        ${visualPrompt || "Not specified"}
                    </p>
                    <h4>📷 Camera</h4>
                    <p>
                        ${cameraPrompt || "Not specified"}
                    </p>
                    <h4>💬 Dialogue</h4>
                    <p>
                        ${dialoguePrompt || "No dialogue"}
                    </p>
                    <h4>🎙️ Audio</h4>
                    <p>
                        ${audioPrompt || "No audio instructions"}
                    </p>
<p>
    ✅ Scene production settings saved
    for the next stage.
</p>
<button id="generateVideoBtn">
    🎥 Generate AI Video
</button>
<button id="saveProjectBtn">
    💾 Save Project
</button> 
                </div>
   `;
        document
            .getElementById("generateVideoBtn")
            .addEventListener("click", function() {
                alert(
                    "🎥 AI Video Generation is ready for this scene."
                );
            });
document
    .getElementById("saveProjectBtn")
    .addEventListener("click", function() {
        localStorage.setItem(
            "movieProject",
            JSON.stringify(movieProject)
        );
        alert("💾 Movie project saved successfully!");
    });
    });
if (
    savedProduction &&
    savedProduction.prepared
) {
    document
        .getElementById("prepareSceneBtn")
        .click();
}
}
function saveStory() {
    movieProject.script.outline =
        document.getElementById("storyOutline").value.trim();
    movieProject.script.act1 =
        document.getElementById("act1").value.trim();
    movieProject.script.act2 =
        document.getElementById("act2").value.trim();
    movieProject.script.act3 =
        document.getElementById("act3").value.trim();
    movieProject.script.screenplay =
        document.getElementById("screenplay").value.trim();
    if (movieProject.script.outline === "") {
        alert("Please enter your story outline.");
        return;
    }
   localStorage.setItem(
    "movieStage",
    "storyStudio"
);
savedStage = "storyStudio";
autoSaveMovie();
alert("Story and screenplay saved successfully!");
}
function showFinalMoviePlan() {
    document.querySelector(".hero").innerHTML = `
        <h2>🎬 ${movieProject.title}</h2>
        <p>
            Your MovieAI Studio project is ready.
        </p>
        <h3>🎥 Project Details</h3>
        <p>
            <strong>Genre:</strong>
            ${movieProject.genre}
        </p>
        <p>
            <strong>Type:</strong>
            ${movieProject.type}
        </p>
        <p>
            <strong>Length:</strong>
            ${movieProject.length}
        </p>
        <p>
            <strong>Visual Style:</strong>
            ${movieProject.style}
        </p>
        <h3>📖 Story</h3>
        <p>
            ${movieProject.idea}
        </p>
        <h3>📝 Story Outline</h3>
        <p>
            ${movieProject.script.outline}
        </p>
        <h3>🎬 Act 1</h3>
        <p>
            ${movieProject.script.act1 || "Not written yet"}
        </p>
        <h3>⚔️ Act 2</h3>
        <p>
            ${movieProject.script.act2 || "Not written yet"}
        </p>
        <h3>🏁 Act 3</h3>
        <p>
            ${movieProject.script.act3 || "Not written yet"}
        </p>
        <h3>👤 Characters</h3>
        <div id="finalCharacters"></div>
        <h3>🎞️ Scenes</h3>
        <div id="finalScenes"></div>
        <h3>🎙️ Voice & Audio</h3>
        <p>
            AI voice, dialogue and music generation will be connected later.
        </p>
        <h3>🎥 AI Video</h3>
        <p>
            AI video generation will be connected later.
        </p>
        <button id="newMovieBtn">
            Create Another Movie 🎬
        </button>
    `;
    const finalCharacters =
        document.getElementById("finalCharacters");
    movieProject.characters.forEach(function(character) {
        finalCharacters.innerHTML += `
            <div class="character">
                <h4>${character.name}</h4>
                <p>
                    <strong>Role:</strong>
                    ${character.role}
                </p>
                <p>
                    <strong>Personality:</strong>
                    ${character.personality || "Not specified"}
                </p>
                <p>
                    <strong>Appearance:</strong>
                    ${character.appearance || "Not specified"}
                </p>

            </div>
        `;
    });
    const finalScenes =
        document.getElementById("finalScenes");
    movieProject.scenes.forEach(function(scene, index) {
        finalScenes.innerHTML += `
            <div class="scene">
                <h4>
                    Scene ${index + 1} — ${scene.title}
                </h4>
                <p>
                    <strong>Location:</strong>
                    ${scene.location || "Not specified"}
                </p>
                <p>
                    <strong>Action:</strong>
                    ${scene.action}
                </p>
                <p>
                    <strong>Dialogue:</strong>
                    ${scene.dialogue || "No dialogue yet"}
                </p>
                <p>
                    <strong>Camera:</strong>
                    ${scene.camera || "Not specified"}
                </p>
            </div>
        `;
    });
document
    .getElementById("newMovieBtn")
    .addEventListener("click", function() {
        // Save the finished movie to the Library first.
        autoSaveMovie();
        // Create a separate, empty movie project.
        movieProject = {
            id: "movie_" + Date.now() + "_" +
                Math.random().toString(36).slice(2, 8),
            title: "",
            idea: "",
            genre: "",
            type: "",
            length: "",
            style: "",
            characters: [],
            characterDraft: {
                name: "",
                role: "Main Protagonist",
                age: "",
                personality: "",
                appearance: "",
                description: ""
            },
            scenes: [],
            sceneDraft: {
                title: "",
                location: "",
                time: "Morning",
                characters: "",
                action: "",
                dialogue: "",
                camera: ""
            },
            production: [],
            script: {
                outline: "",
                act1: "",
                act2: "",
                act3: "",
                screenplay: ""
            }
        };
        savedStage = "movieCreator";
        localStorage.setItem(
            "movieStage",
            "movieCreator"
        );
        localStorage.removeItem("movieSceneNumber");
        // Save the new movie separately in the Library.
        autoSaveMovie();
        showMovieCreator();
    });
}