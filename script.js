document.addEventListener("DOMContentLoaded", function () {
    async function fetchPlanets() {
        const response = await fetch('data/planets-wallpaper.json');
        return response.json();
    }
    async function updateBackgroundWithPlanet() {
        const data = await fetchPlanets();
        const planets = data.planets;
        const randomPlanet = planets[Math.floor(Math.random() * planets.length)];
        const pageWrap = document.querySelector('.page-wrap');
        pageWrap.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url('${randomPlanet.image}')`;
        pageWrap.style.backgroundSize = 'cover';
        pageWrap.style.backgroundPosition = 'center';
        const planetNameElement = document.querySelector('.time');
        planetNameElement.textContent = `[${randomPlanet.name}]`;
    }
    window.addEventListener('load', updateBackgroundWithPlanet);

    async function fetchData(episode) {
        const response = await fetch(`data/data${episode}.json`);
        return response.json();
    }

    const episodeButtons = document.querySelectorAll('.episode-buttons button');
    const titleElement = document.querySelector('section h1');
    const episodeTitles = [
        'La Menace fantôme',
        'L’Attaque des clones',
        'La Revanche des Sith',
        'Un nouvel espoir',
        'L’Empire contre-attaque',
        'Le Retour du Jedi',
        'La Menace fantôme',
        'Les Derniers Jedi',
        'L’Ascension de Skywalker',
        'Rogue One',
        'Solo, a Star Wars story'
    ];

    function handleEpisodeChange(episode) {
        if (episode == 10) {
            titleElement.textContent = `Spinoff : ${episodeTitles[9]}`;
        } else if (episode == 11) {
            titleElement.textContent = `Spinoff : ${episodeTitles[10]}`;
        } else {
            titleElement.textContent = `Episode ${episode} : ${episodeTitles[episode - 1]}`;
        }
    }
    handleEpisodeChange(4);

    episodeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const episode = this.id.replace('episode', '');
            handleEpisodeChange(episode);
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
            hidden: false
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
                            color: 'rgba(255, 255, 255, 0.35)',
                            align: 'start'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)',
                            lineWidth: 0.7
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                family: 'Afacad Flux'
                            },
                            color: 'white',
                            callback: function () {
                                return '';
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            },
            plugins: [{
                afterDraw: function (chart) {
                    const yScale = chart.scales.y;
                    const canvas = chart.canvas;
                    canvas.classList.remove('canvas-pointer');
                    const planetAreas = [];

                    planetImages.forEach((planet, index) => {
                        const isPlanetVisited = chart.data.datasets.some(dataset => {
                            return !dataset.hidden && dataset.data.some(point => point.y === index);
                        });

                        planet.opacity = isPlanetVisited ? 1 : 0;

                        chart.ctx.globalAlpha = planet.opacity;
                        const yPos = yScale.getPixelForValue(index);
                        const planetXPosition = chart.chartArea.left - 80;
                        const planetImageWidth = 50;

                        chart.ctx.drawImage(planet.img, planetXPosition, yPos - 30, planetImageWidth, 50);

                        chart.ctx.fillStyle = 'white';
                        chart.ctx.textAlign = 'center';

                        chart.ctx.fillText(
                            planet.name,
                            planetXPosition + planetImageWidth / 2,
                            yPos + 35
                        );

                        planetAreas.push({
                            x: planetXPosition,
                            y: yPos - 30,
                            width: planetImageWidth,
                            height: 50
                        });
                    });

                    chart.ctx.globalAlpha = 1;

                    chart.canvas.addEventListener('mousemove', function (event) {
                        const mouseY = event.offsetY;
                        const mouseX = event.offsetX;
                        const isPointerOnPlanet = planetAreas.some(planetArea => {
                            return mouseX >= planetArea.x && mouseX <= planetArea.x + planetArea.width &&
                                mouseY >= planetArea.y && mouseY <= planetArea.y + planetArea.height;
                        });

                        if (isPointerOnPlanet) {
                            canvas.classList.add('canvas-pointer');
                        } else {
                            canvas.classList.remove('canvas-pointer');
                        }
                    });

                    chart.canvas.addEventListener('click', function (event) {
                        const clickY = event.offsetY;
                        const clickX = event.offsetX;
                        planetAreas.forEach((planetArea, index) => {
                            if (clickX >= planetArea.x && clickX <= planetArea.x + planetArea.width &&
                                clickY >= planetArea.y && clickY <= planetArea.y + planetArea.height) {
                                showModal(planets[index]);
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
        const episodeButtons = document.querySelectorAll('.episode-buttons button');
        episodeButtons.forEach(button => button.classList.remove('active'));
        document.getElementById(`episode${episode}`).classList.add('active');

        if (window.myChart && typeof window.myChart.destroy === 'function') {
            window.myChart.destroy();
        }

        const data = await fetchData(episode);
        const { planets, characters } = data;

        const legendContainer = document.getElementById('legendContainer');
        legendContainer.innerHTML = '';
        characters.forEach((character, index) => {
            const button = createLegendButton(character.name, character.color, index);
            legendContainer.appendChild(button);
        });

        window.myChart = createChart(planets, characters);
        window.myChart.update();
    }

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

    loadEpisodeData(4);

    function setEpisodeButtonBackgrounds() {
        const episodeButtons = document.querySelectorAll('.episode-buttons button');

        episodeButtons.forEach(button => {
            const episodeId = button.id.replace('episode', '');
            button.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('images/posters/sw${episodeId}.png')`;
            button.style.backgroundSize = 'cover';
            button.style.backgroundPosition = 'center';
        });
    }

    setEpisodeButtonBackgrounds();

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
        modalWrap.src = `images/planets/${planet.image}`;
        planetImageElement.classList.add('rotate');
        planetImageElement.style.maxWidth = '350px';
        modal.style.display = "flex";
        body.style.overflow = 'hidden';
    }

    span.onclick = function () {
        modal.style.display = "none";
        planetImageElement.classList.remove('rotate');
        body.style.overflow = 'auto';
    }

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            planetImageElement.classList.remove('rotate');
            body.style.overflow = 'auto';
        }
    }

    const audio = document.getElementById("myAudio");
    const toggleButton = document.getElementById("toggleSound");

    audio.volume = 0;

    toggleButton.addEventListener("click", function () {
        if (audio.paused) {
            audio.volume = 1;
            audio.play();
            toggleButton.classList.add("active");
            toggleButton.textContent = "🤫";
        } else {
            audio.pause();
            toggleButton.classList.remove("active");
            toggleButton.textContent = "🎷";
        }
    });

    const loader = document.querySelector('.loader');

    if (sessionStorage.getItem('isLoaded') === null) {
        loader.style.display = 'flex';
        setTimeout(() => {
            loader.style.opacity = 0;
            loader.style.transition = 'opacity 1s';
            setTimeout(() => {
                loader.remove();
                document.body.style.overflowY = 'auto';
                sessionStorage.setItem('isLoaded', 'true');
            }, 1000);
        }, 7000);
    } else if (sessionStorage.getItem('isLoaded', 'true')) {
        loader.remove();
        document.body.style.overflowY = 'auto';
    }

    const legalBtn = document.querySelector('.legalbtn');
    const legalPopup = document.querySelector('.legalpopup');
    const closeLegalContent = document.querySelector('.closelegalcontent');

    legalBtn.addEventListener('click', () => {
        legalPopup.style.display = 'flex';
        body.style.overflow = 'hidden';
    });

    closeLegalContent.addEventListener('click', () => {
        legalPopup.style.display = 'none';
        body.style.overflow = 'auto';
    });

});