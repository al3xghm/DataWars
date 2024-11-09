document.addEventListener("DOMContentLoaded", function () {
    async function fetchPlanets() {
        const response = await fetch('data/planets-wallpaper.json');
        return response.json();
    }

    // Fonction pour changer le fond de la page-wrap et le titre avec le nom de la planète
    async function updateBackgroundWithPlanet() {
        const data = await fetchPlanets();
        const planets = data.planets;

        // Sélectionner une planète aléatoire
        const randomPlanet = planets[Math.floor(Math.random() * planets.length)];

        // Changer le background de la .page-wrap avec un linear-gradient + image
        const pageWrap = document.querySelector('.page-wrap');
        pageWrap.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url('${randomPlanet.image}')`;
        pageWrap.style.backgroundSize = 'cover';
        pageWrap.style.backgroundPosition = 'center';

        // Mettre à jour le texte "[Kashyyyk]" avec le nom de la planète sélectionnée
        const planetNameElement = document.querySelector('.time');
        planetNameElement.textContent = `[${randomPlanet.name}]`;
    }

    // Appeler la fonction au chargement de la page
    window.addEventListener('load', updateBackgroundWithPlanet);

    async function fetchData(episode) {
        const response = await fetch(`data/data${episode}.json`);
        return response.json();
    }

    const episodeButtons = document.querySelectorAll('.episode-buttons button');
    const titleElement = document.querySelector('section h1'); // Sélectionnez le H1 de la section

    // Tableau des titres des épisodes
    const episodeTitles = [
        'La Menace fantôme', // Episode I
        'L’Attaque des clones', // Episode II
        'La Revanche des Sith', // Episode III
        'Un nouvel espoir', // Episode IV
        'L’Empire contre-attaque', // Episode V
        'Le Retour du Jedi', // Episode VI
        'La Menace fantôme', // Episode VII
        'Les Derniers Jedi', // Episode VIII
        'L’Ascension de Skywalker', // Episode IX
        'Rogue One', // Spinoff
        'Solo, a Star Wars story' // Spinoff
    ];

    function handleEpisodeChange(episode) {
        if (episode == 10) { // Cas spécial pour "Rogue One"
            titleElement.textContent = `Spinoff : ${episodeTitles[9]}`; // Affiche "Spinoff : Rogue One"
        } else if (episode == 11) { // Cas spécial pour "Solo, a Star Wars story"
            titleElement.textContent = `Spinoff : ${episodeTitles[10]}`; // Affiche "Spinoff : Solo: A Star Wars Story"
        } else {
            titleElement.textContent = `Episode ${episode} : ${episodeTitles[episode - 1]}`;
        }
    }
    // Initialisation par défaut
    handleEpisodeChange(4); // Définit le titre par défaut à l'épisode IV

    // Écoutez les clics sur les boutons
    episodeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const episode = this.id.replace('episode', ''); // Récupère le numéro de l'épisode à partir de l'ID du bouton
            handleEpisodeChange(episode); // Met à jour le titre et le graphique
        });
    });


    function createLegendButton(name, color, index) {
        const button = document.createElement('button');
        button.className = 'legend-button';
        button.style.borderColor = color;
        button.style.color = color;
        button.innerText = name;
        button.onclick = function () {
            toggleDataset(index);
        };
        return button;
    }

    function createChart(planets, characters) {
        const ctx = document.getElementById('myChart').getContext('2d');
        const planetImages = planets.map(planet => ({ img: new Image(), opacity: 0, name: planet.name }));

        planetImages.forEach((planet, index) => {
            planet.img.src = 'images/planets/' + planets[index].image;
        });

        const datasets = characters.map((character, index) => ({
            label: character.name,
            borderColor: character.color,
            data: character.path.map(event => ({ x: event.event, y: event.planet })),
            fill: false,
            tension: character.tension || 0.4,
            cubicInterpolationMode: 'cubic',
            pointRadius: 5,
            hidden: false,
            // 
        }));

        const myChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                layout: {
                    padding: {
                        top: 50,
                        bottom: 50,
                        left: 80
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function (tooltipItems) {
                                const yValue = tooltipItems[0].parsed.y;
                                const planetName = planets[yValue].name;

                                const charactersAtPoint = tooltipItems.map(item => item.dataset.label).filter((label, index, self) => self.indexOf(label) === index);

                                if (charactersAtPoint.length > 1) {
                                    const lastCharacter = charactersAtPoint.pop();
                                    return `${charactersAtPoint.join(', ')} et ${lastCharacter} sont sur ${planetName}`;
                                }

                                return `${charactersAtPoint[0]} sur ${planetName}`;
                            },
                            label: function (tooltipItem) {
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        position: 'top',
                        labels: characters[0].path.map(tee => tee.event),
                        ticks: {
                            font: {
                                family: 'Afacad Flux',
                                size: 14
                            },
                            color: 'rgba(255, 255, 255, 0.35)', // Gris clair pour les événements
                            align: 'start'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)', // Couleur des lignes verticales (gris)
                            lineWidth: 0.7 // Épaisseur des lignes
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                family: 'Afacad Flux'
                            },
                            color: 'white',
                            callback: function () {
                                return ''; // Ne pas afficher de valeurs sur l'axe Y
                            }
                        },
                        grid: {
                            display: false // Cacher les lignes horizontales
                        }
                    }
                }
            },
            plugins: [{
                afterDraw: function (chart) {
                    const yScale = chart.scales.y;
                    const canvas = chart.canvas;
                    canvas.classList.remove('canvas-pointer'); // Retire la classe au début

                    // Stocker les zones des planètes
                    const planetAreas = [];

                    planetImages.forEach((planet, index) => {
                        const isPlanetVisited = chart.data.datasets.some(dataset => {
                            return !dataset.hidden && dataset.data.some(point => point.y === index);
                        });

                        planet.opacity = isPlanetVisited ? 1 : 0;

                        chart.ctx.globalAlpha = planet.opacity;
                        const yPos = yScale.getPixelForValue(index);

                        // Position de l'image de la planète
                        const planetXPosition = chart.chartArea.left - 80;
                        const planetImageWidth = 50; // Largeur de l'image de la planète

                        // Dessiner l'image de la planète
                        chart.ctx.drawImage(planet.img, planetXPosition, yPos - 30, planetImageWidth, 50);

                        // Configurer le style pour le texte
                        chart.ctx.fillStyle = 'white';
                        chart.ctx.textAlign = 'center'; // Centrer le texte

                        // Dessiner le texte centré sous l'image de la planète
                        chart.ctx.fillText(
                            planet.name,
                            planetXPosition + planetImageWidth / 2, // Position X centrée
                            yPos + 35 // Position Y sous l'image
                        );

                        // Ajouter la zone de la planète
                        planetAreas.push({
                            x: planetXPosition,
                            y: yPos - 30,
                            width: planetImageWidth,
                            height: 50
                        });
                    });


                    chart.ctx.globalAlpha = 1;

                    // Gestion des événements de la souris
                    chart.canvas.addEventListener('mousemove', function (event) {
                        const mouseY = event.offsetY;
                        const mouseX = event.offsetX;

                        // Vérifier si la souris est sur l'une des images de la planète
                        const isPointerOnPlanet = planetAreas.some(planetArea => {
                            return mouseX >= planetArea.x && mouseX <= planetArea.x + planetArea.width &&
                                mouseY >= planetArea.y && mouseY <= planetArea.y + planetArea.height;
                        });

                        if (isPointerOnPlanet) {
                            canvas.classList.add('canvas-pointer'); // Ajoute la classe pour le curseur pointer
                        } else {
                            canvas.classList.remove('canvas-pointer'); // Retire la classe
                        }
                    });

                    chart.canvas.addEventListener('click', function (event) {
                        const clickY = event.offsetY;
                        const clickX = event.offsetX;

                        // Vérifier si le clic est sur l'une des images de la planète
                        planetAreas.forEach((planetArea, index) => {
                            if (clickX >= planetArea.x && clickX <= planetArea.x + planetArea.width &&
                                clickY >= planetArea.y && clickY <= planetArea.y + planetArea.height) {
                                showModal(planets[index]); // Afficher la modale avec les infos de la planète
                            }
                        });
                    });
                }
            }]
        });


        return myChart;
    }

    function toggleDataset(datasetIndex) {
        const dataset = myChart.data.datasets[datasetIndex];
        dataset.hidden = !dataset.hidden;

        const button = document.querySelectorAll('.legend-button')[datasetIndex];
        if (dataset.hidden) {
            button.style.color = 'grey';
            button.style.borderColor = 'grey';
        } else {
            button.style.color = dataset.borderColor;
            button.style.borderColor = dataset.borderColor;
        }

        myChart.update();
    }

    async function loadEpisodeData(episode) {
        // Effacer l'état de tous les boutons d'épisode
        const episodeButtons = document.querySelectorAll('.episode-buttons button');
        episodeButtons.forEach(button => button.classList.remove('active'));

        // Ajouter la classe 'active' au bouton sélectionné
        document.getElementById(`episode${episode}`).classList.add('active');

        if (window.myChart && typeof window.myChart.destroy === 'function') {
            window.myChart.destroy();
        }

        const data = await fetchData(episode);
        const { planets, characters } = data;

        const legendContainer = document.getElementById('legendContainer');
        legendContainer.innerHTML = ''; // Effacer les boutons de légende précédents
        characters.forEach((character, index) => {
            const button = createLegendButton(character.name, character.color, index);
            legendContainer.appendChild(button);
        });

        // Créer le graphique avec les nouveaux personnages et planètes
        window.myChart = createChart(planets, characters);

        // Forcer un redessin du graphique
        window.myChart.update(); // <<< Ajoutez cette ligne
    }

    // Gestion des boutons d'épisode
    document.getElementById('episode1').addEventListener('click', () => loadEpisodeData(1));
    document.getElementById('episode2').addEventListener('click', () => loadEpisodeData(2));
    document.getElementById('episode3').addEventListener('click', () => loadEpisodeData(3));
    document.getElementById('episode4').addEventListener('click', () => loadEpisodeData(4));
    document.getElementById('episode5').addEventListener('click', () => loadEpisodeData(5));
    document.getElementById('episode6').addEventListener('click', () => loadEpisodeData(6));
    document.getElementById('episode7').addEventListener('click', () => loadEpisodeData(7));
    document.getElementById('episode8').addEventListener('click', () => loadEpisodeData(8));
    document.getElementById('episode9').addEventListener('click', () => loadEpisodeData(9));
    document.getElementById('episode10').addEventListener('click', () => loadEpisodeData(10));
    document.getElementById('episode11').addEventListener('click', () => loadEpisodeData(11));

    // Initialisation pour l'épisode IV par défaut
    loadEpisodeData(4);

    // Définir les images de fond pour les boutons d'épisode
    function setEpisodeButtonBackgrounds() {
        const episodeButtons = document.querySelectorAll('.episode-buttons button');

        episodeButtons.forEach(button => {
            const episodeId = button.id.replace('episode', ''); // Récupérer le numéro de l'épisode à partir de l'ID
            button.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('images/posters/sw${episodeId}.png')`;
            button.style.backgroundSize = 'cover'; // Ajuste la taille de l'image
            button.style.backgroundPosition = 'center'; // Centre l'image
        });
    }

    // Appeler la fonction pour définir les images de fond
    setEpisodeButtonBackgrounds();

    // Sélectionner les éléments de la modale
    const body = document.querySelector('body');
    const modal = document.getElementById("planetModal");
    const modalWrap = document.getElementById("modal-wrap-bg");
    const span = document.getElementsByClassName("close")[0];
    const planetNameElement = document.getElementById("planetName");
    const planetImageElement = document.getElementById("planetImage");
    const planetDescriptionElement = document.getElementById("planetDescription");
    const planetLocationElement = document.getElementById("planetLocation");
    const planetTypeElement = document.getElementById("planetType");
    const planetPopulationElement = document.getElementById("planetPopulation");
    const planetClimateElement = document.getElementById("planetClimate");
    const planetLandscapeElement = document.getElementById("planetLandscape");
    const planetNotablePlacesElement = document.getElementById("planetNotablePlaces");
    const planetAffiliationElement = document.getElementById("planetAffiliation");

    function showModal(planet) {
        planetNameElement.innerText = planet.name;
        planetImageElement.src = `images/planets/${planet.image}`;
        planetDescriptionElement.innerText = planet.description;
        planetLocationElement.innerText = planet.location;
        planetTypeElement.innerText = planet.type;
        planetPopulationElement.innerText = planet.population;
        planetClimateElement.innerText = planet.climate;
        planetLandscapeElement.innerText = planet.landscape;
        planetNotablePlacesElement.innerText = planet.notable_places.join(', ');
        planetAffiliationElement.innerText = planet.affiliation.join(', ');
        // modalWrap[0].style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url('images/planets/${planet.image}')`;

        modalWrap.src = `images/planets/${planet.image}`;

        // Ajoute la classe de rotation à l'image
        planetImageElement.classList.add('rotate');
        planetImageElement.style.maxWidth = '350px';
        modal.style.display = "flex";
        body.style.overflow = 'hidden'; // Empêche le défilement de la page
    }

    // Fermer la modale lorsqu'on clique sur le bouton de fermeture
    span.onclick = function () {
        modal.style.display = "none";
        planetImageElement.classList.remove('rotate'); // Retirer la classe de rotation à la fermeture
        body.style.overflow = 'auto'; // Active le défilement de la page
    }

    // Optionnel : Fermer la modale en cliquant en dehors d'elle
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            planetImageElement.classList.remove('rotate'); // Retirer la classe de rotation
            body.style.overflow = 'auto'; // Réactiver le défilement
        }
    }




    const audio = document.getElementById("myAudio");
    const toggleButton = document.getElementById("toggleSound");

    // Désactiver le son par défaut
    audio.volume = 0;

    // Gérer le clic sur le bouton
    toggleButton.addEventListener("click", function () {
        if (audio.paused) {
            audio.volume = 1; // Active le son
            audio.play(); // Joue la musique
            toggleButton.classList.add("active"); // Optionnel : changez l'apparence du bouton
            toggleButton.textContent = "🤫"; // Optionnel : changez le texte du bouton
        } else {
            audio.pause(); // Met en pause la musique
            toggleButton.classList.remove("active");
            toggleButton.textContent = "🎷";
        }
    });

    // loader at the start of the page, remove it from dom after 10 seconds
    const loader = document.querySelector('.loader');

    setTimeout(() => {
        loader.style.opacity = 0;
        loader.style.transition = 'opacity 1s';
        setTimeout(() => {
            loader.remove();
            document.body.style.overflowY = 'auto';
        }
            , 1000);
    }, 7000);

});