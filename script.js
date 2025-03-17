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
    const colorPercentSpans = Array.from(document.querySelectorAll("input[type='range'][id^='color'][id$='Percent'] + span"));

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

    function getSelectedShape() {
        return document.querySelector("input[name='shape']:checked").value;
    }

    class Particle {
        constructor(x, y, angle) {
            this.x = x;
            this.y = y;
            this.color = getColor();
            this.angle = angle;
            this.radius = Math.random() * (parseFloat(particleSizeSlider.value) - 2) + 2;
            this.speedVariance = Math.random() * parseFloat(speedVarianceSlider.value);
            this.speed = this.speedVariance + parseFloat(speedSlider.value);
            this.angularVelocity = Math.random() * 0.01 + 0.004;
            this.distance = 0;
            this.lifespan = parseFloat(lifespanSlider.value);
            this.pathShape = parseFloat(pathShapeSlider.value);
            this.shape = getSelectedShape();
            this.opacity = parseFloat(opacitySlider.value);
        }
        

        update() {
            this.speed = this.speedVariance + parseFloat(speedSlider.value);
            this.angularVelocity = parseFloat(angularVelocitySlider.value);
            this.radius *= parseFloat(fadingSlider.value);
            this.distance += this.speed * this.pathShape * 3;
            this.angle += this.angularVelocity;
            this.x = canvas.width / 2 + Math.cos(this.angle) * this.distance;
            this.y = canvas.height / 2 + Math.sin(this.angle) * this.distance;
            this.lifespan -= 0.01;
            this.opacity = parseFloat(opacitySlider.value);
        }
        

        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;

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
