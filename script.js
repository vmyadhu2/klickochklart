const menuButton = document.querySelector('.menu-button');
const mainNavigation = document.querySelector('.main-nav');
const navigationLinks = document.querySelectorAll('.main-nav a');

menuButton.addEventListener('click', () => {
  const isOpen = mainNavigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('menu-open', isOpen);
});

navigationLinks.forEach((link) => {
  link.addEventListener('click', () => {
    mainNavigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  });
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});

const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const contactEmail = contactForm.dataset.contactEmail;
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    const subject = 'New Fortnox automation enquiry from klickochklart.se';
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      'Repeated task:',
      message,
    ].join('\n');

    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

document.getElementById('current-year').textContent = new Date().getFullYear();
