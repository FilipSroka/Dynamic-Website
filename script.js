document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("swirlCanvas");
    const ctx = canvas.getContext("2d");

    // Get sliders and value displays
    const sliders = [
        { slider: "speedSlider", value: "speedValue" },
        { slider: "angularVelocitySlider", value: "angularVelocityValue" },
        { slider: "fadingSlider", value: "fadingValue" },
        { slider: "particleCountSlider", value: "particleCountValue" },
        { slider: "particleSizeSlider", value: "particleSizeValue" },
        { slider: "pathShapeSlider", value: "pathShapeValue" },
        { slider: "speedVarianceSlider", value: "speedVarianceValue" },
        { slider: "lifespanSlider", value: "lifespanValue" },
        { slider: "opacitySlider", value: "opacityValue" },
        { slider: "trailPersistenceSlider", value: "trailPersistenceValue" }
    ];

    sliders.forEach(({ slider, value }) => {
        const input = document.getElementById(slider);
        const display = document.getElementById(value);
        input.addEventListener("input", () => {
            display.textContent = input.value;
        });
    });

    // Get color pickers and percentage sliders
    const colorInputs = Array.from(document.querySelectorAll("input[type='color']"));
    const colorPercentSliders = Array.from(document.querySelectorAll("input[type='range'][id^='color'][id$='Percent']"));

    // Ensure canvas resizes properly
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];

    function normalizeColorPercentages(changedSlider) {
        let total = 0;
        let remainingSliders = colorPercentSliders.filter(slider => slider !== changedSlider);

        // Calculate total excluding the changed slider
        remainingSliders.forEach(slider => total += parseInt(slider.value, 10));

        let newTotal = total + parseInt(changedSlider.value, 10);

        if (newTotal !== 100) {
            let diff = 100 - newTotal; // Difference needed to reach 100%
            let adjustableSliders = remainingSliders.filter(slider => 
                (diff > 0 && parseInt(slider.value, 10) < 100) || 
                (diff < 0 && parseInt(slider.value, 10) > 0)
            );

            let i = 0;
            while (diff !== 0 && adjustableSliders.length > 0) {
                let slider = adjustableSliders[i % adjustableSliders.length];
                let currentValue = parseInt(slider.value, 10);
                let newValue = currentValue + (diff > 0 ? 1 : -1);

                // Ensure newValue is within valid bounds (0 to 100)
                if (newValue >= 0 && newValue <= 100) {
                    slider.value = newValue;
                    slider.nextElementSibling.textContent = newValue + "%";
                    diff += (diff > 0 ? -1 : 1); // Reduce the remaining difference
                }

                i++;
                if (i >= adjustableSliders.length) i = 0; // Loop over adjustable sliders
            }
        }

        // Ensure displayed values update correctly
        changedSlider.nextElementSibling.textContent = changedSlider.value + "%";
    }




    // Attach event listeners to color sliders
    colorPercentSliders.forEach(slider => {
        slider.addEventListener("input", function () {
            normalizeColorPercentages(this);
        });
    });

    function getColor() {
        let totalPercent = 0;
        let ranges = [];

        for (let i = 0; i < colorPercentSliders.length; i++) {
            totalPercent += parseInt(colorPercentSliders[i].value);
            ranges.push(totalPercent);
        }

        let randomValue = Math.random() * 100;
        for (let i = 0; i < ranges.length; i++) {
            if (randomValue <= ranges[i]) {
                return colorInputs[i].value;
            }
        }
        return colorInputs[0].value;
    }
    

    class Particle {
        constructor(x, y, angle) {
            this.x = x;
            this.y = y;
            this.color = getColor();  // Fetch the color using getColor() function
            this.angle = angle;
            this.radius = Math.random() * (parseFloat(particleSizeSlider.value) - 2) + 2;
            this.speedVariance = Math.random() * parseFloat(speedVarianceSlider.value);
            this.speed = this.speedVariance + parseFloat(speedSlider.value);
            this.angularVelocity = Math.random() * 0.01 + 0.004;
            this.distance = 0;
            this.lifespan = parseFloat(lifespanSlider.value);
            this.pathShape = parseFloat(pathShapeSlider.value);
            this.shape = document.getElementById("particleShapeDropdown").value;
            this.opacity = parseFloat(opacitySlider.value);
            this.movementType = document.getElementById('movementTypeSelector').value;
    
            // Map the color to the corresponding letter (M, O, D, U, S)
            const colorMap = ["M", "O", "D", "U", "S"];
    
            // Find the index of the particle's color in the colorInputs array and assign the corresponding letter
            this.letter = "";
            colorInputs.forEach((input, index) => {
                if (this.color === input.value) {
                    this.letter = colorMap[index];  // Map color to letter based on its position
                }
            });
        }

        update() {
            this.speed = this.speedVariance + parseFloat(speedSlider.value);
            this.angularVelocity = parseFloat(angularVelocitySlider.value);
            this.radius *= parseFloat(fadingSlider.value);
        
            // Select the movement type based on the dropdown
            if (this.movementType === 'spiral') {
                this.distance += this.speed * this.pathShape * 3; // Spiral speed multiplier
                this.angle += this.angularVelocity;
                let r = this.distance;
                this.x = canvas.width / 2 + Math.cos(this.angle) * r;
                this.y = canvas.height / 2 + Math.sin(this.angle) * r;
            } else if (this.movementType === 'wave') {
                this.distance += this.speed * this.pathShape * 3; // Wave speed multiplier
                this.angle += this.angularVelocity;
                let r = this.distance * (1 + 0.3 * Math.sin(3 * this.angle) * Math.cos(2 * this.angle));
                this.x = canvas.width / 2 + Math.cos(this.angle) * r;
                this.y = canvas.height / 2 + Math.sin(this.angle) * r;
            } else if (this.movementType === 'butterfly') {
                this.distance += this.speed * this.pathShape * 1.5; // Butterfly speed multiplier
                this.angle += this.angularVelocity;
                let r = (200 + this.distance) * Math.sin(4 * this.angle) * Math.cos(this.angle); // Butterfly curve (with increasing radius)
                // Rotate butterfly by 180 degrees and center it
                this.x = canvas.width / 2 - r * Math.cos(this.angle); // Inverted x for 180-degree rotation
                this.y = canvas.height / 2 - r * Math.sin(this.angle); // Inverted y for 180-degree rotation
            } else if (this.movementType === 'rose') {
                this.distance += this.speed * this.pathShape * 0.5; // Reduced speed for rose
                this.angle += this.angularVelocity;
                let k = 5; // Number of petals
                let r = (100 + this.distance) * Math.cos(k * this.angle); // Rose curve equation
                this.x = canvas.width / 2 + r * Math.cos(this.angle);
                this.y = canvas.height / 2 + r * Math.sin(this.angle);
            } else if (this.movementType === 'logarithmicSpiral') {
                this.distance += this.speed * this.pathShape * 0.1; // Reduced speed for spiral
                this.angle += this.angularVelocity;
                let a = 100;
                let b = 0.15;
                let r = a * Math.exp(b * this.angle) + this.distance; // Logarithmic spiral equation with increasing radius
                this.x = canvas.width / 2 + r * Math.cos(this.angle);
                this.y = canvas.height / 2 + r * Math.sin(this.angle);
            } else if (this.movementType === 'lemniscate') {
                this.distance += this.speed * this.pathShape * 0.5; // Reduced speed for lemniscate
                this.angle += this.angularVelocity;
                let r = 100 * Math.cos(2 * this.angle); // Lemniscate equation
                let rScale = this.distance / 50;
                this.x = canvas.width / 2 + r * rScale * Math.cos(this.angle);
                this.y = canvas.height / 2 + r * rScale * Math.sin(this.angle);
            } else if (this.movementType === 'epicycloid') {
                this.distance += this.speed * this.pathShape * 0.5; // Reduced speed for epicycloid
                this.angle += this.angularVelocity;
                let R = 150;
                let r = 50;
                let d = 100;
                let x = (R - r) * Math.cos(this.angle) + d * Math.cos((R - r) / r * this.angle);
                let y = (R - r) * Math.sin(this.angle) - d * Math.sin((R - r) / r * this.angle);
                let rScale = this.distance / 50;
                this.x = canvas.width / 2 + x * rScale;
                this.y = canvas.height / 2 + y * rScale;
            } else if (this.movementType === 'hypotrochoid') {
                this.distance += this.speed * this.pathShape * 0.5; // Reduced speed for hypotrochoid
                this.angle += this.angularVelocity;
                let R = 150;
                let r = 60;
                let d = 100;
                let x = (R - r) * Math.cos(this.angle) + d * Math.cos((R - r) / r * this.angle);
                let y = (R - r) * Math.sin(this.angle) - d * Math.sin((R - r) / r * this.angle);
                let rScale = this.distance / 50;
                this.x = canvas.width / 2 + x * rScale;
                this.y = canvas.height / 2 + y * rScale;
            } else if (this.movementType === 'figureEight') {
                this.distance += this.speed * this.pathShape * 0.5; // Reduced speed for figure 8
                this.angle += this.angularVelocity;
                let a = 100;
                let r = a + this.distance; // Radius increases over time
                let x = r * Math.sin(this.angle);
                let y = r * Math.sin(2 * this.angle); 
                this.x = canvas.width / 2 + x;
                this.y = canvas.height / 2 + y;
            }
        
            this.lifespan -= 0.01;
            this.opacity = parseFloat(opacitySlider.value);
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
    
            // Draw the particle based on its shape
            switch (this.shape) {
                case "circle":
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case "square":
                    ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
                    break;
                case "triangle":
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y - this.radius);
                    ctx.lineTo(this.x - this.radius, this.y + this.radius);
                    ctx.lineTo(this.x + this.radius, this.y + this.radius);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case "letters":
                    ctx.font = `${this.radius * 2}px Arial`;  // Font size scales with radius
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(this.letter, this.x, this.y);  // Draw the corresponding letter
                    break;
            }
    
            ctx.globalAlpha = 1;
        }
        
    }

    function createParticles() {
        const count = parseInt(particleCountSlider.value);
        for (let i = 0; i < count; i++) {
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            const angle = Math.random() * Math.PI * 2;
            particles.push(new Particle(x, y, angle));
        }
    }

    function animate() {
        let trailPersistence = parseFloat(trailPersistenceSlider.value);
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - trailPersistence})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach((particle, index) => {
            particle.update();
            particle.draw();
            if (particle.lifespan <= 0 || particle.radius < 0.5) {
                particles.splice(index, 1);
            }
        });

        createParticles();
        requestAnimationFrame(animate);
    }

    animate();
});
