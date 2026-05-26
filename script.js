window.addEventListener("load", () => {
  const loader = document.getElementById("loader");

  setTimeout(() => {
    loader.style.opacity = "0";

    setTimeout(() => {
      loader.style.display = "none";
    }, 1000);

  }, 2500);
});

// PARTICLE GENERATION

const particles = document.querySelector('.particles');

for (let i = 0; i < 70; i++) {
  const particle = document.createElement('span');

  particle.style.left = Math.random() * 100 + 'vw';
  particle.style.top = Math.random() * 100 + 'vh';

  particle.style.width = particle.style.height = Math.random() * 4 + 1 + 'px';

  particle.style.animationDuration = Math.random() * 10 + 5 + 's';

  particle.style.opacity = Math.random();

  particle.style.position = 'fixed';
  particle.style.background = '#a855f7';
  particle.style.borderRadius = '50%';
  particle.style.boxShadow = '0 0 10px #a855f7';
  particle.style.zIndex = '-1';

  particle.animate([
    {
      transform: 'translateY(0px)'
    },
    {
      transform: 'translateY(-100vh)'
    }
  ], {
    duration: Math.random() * 10000 + 10000,
    iterations: Infinity
  });

  particles.appendChild(particle);
}