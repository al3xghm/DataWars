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
    'L’Ascension de Skywalker' // Episode IX
];

// Fonction pour mettre à jour le titre et gérer les clics sur les boutons
function handleEpisodeChange(episode) {
    titleElement.textContent = `Episode ${episode} : ${episodeTitles[episode - 1]}`;
    // Ajoutez ici la logique pour changer le graphique selon l'épisode
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
        tension: 0.4,
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
                            family: 'Afacad Flux'
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
                    chart.ctx.drawImage(planet.img, chart.chartArea.left - 80, yPos - 30, 50, 50);
                    chart.ctx.fillStyle = 'white';
                    chart.ctx.fillText(planet.name, chart.chartArea.left - 80, yPos + 35);
    
                    // Ajouter la zone de la planète
                    planetAreas.push({
                        x: chart.chartArea.left - 80,
                        y: yPos - 30,
                        width: 50,
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

// Initialisation pour l'épisode IV par défaut
loadEpisodeData(4);

// Définir les images de fond pour les boutons d'épisode
function setEpisodeButtonBackgrounds() {
    const episodeButtons = document.querySelectorAll('.episode-buttons button');

    episodeButtons.forEach(button => {
        const episodeId = button.id.replace('episode', ''); // Récupérer le numéro de l'épisode à partir de l'ID
        button.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('sw${episodeId}.png')`;
        button.style.backgroundSize = 'cover'; // Ajuste la taille de l'image
        button.style.backgroundPosition = 'center'; // Centre l'image
    });
}

// Appeler la fonction pour définir les images de fond
setEpisodeButtonBackgrounds();


// Sélectionner les éléments de la modale
const modal = document.getElementById("planetModal");
const span = document.getElementsByClassName("close")[0];
const planetNameElement = document.getElementById("planetName");
const planetImageElement = document.getElementById("planetImage");
const planetDescriptionElement = document.getElementById("planetDescription");

function showModal(planet) {
    planetNameElement.innerText = planet.name;
    planetImageElement.src = `images/planets/${planet.image}`;
    planetDescriptionElement.innerText = `Description de ${planet.name}`;
    
    // Ajoute la classe de rotation à l'image
    planetImageElement.classList.add('rotate');
    planetImageElement.style.maxWidth = '400px';
    modal.style.display = "flex";
}


// Fermer la modale lorsqu'on clique sur le bouton de fermeture
span.onclick = function () {
    modal.style.display = "none";
}

// Fermer la modale en dehors de celle-ci
window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}
