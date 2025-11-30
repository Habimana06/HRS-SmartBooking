// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Custom interactions for the customer experience UI.
(function () {
    const controls = document.querySelectorAll('[data-carousel-button]');
    controls.forEach(button => {
        button.addEventListener('click', () => {
            const targetSelector = button.getAttribute('data-target');
            const direction = button.getAttribute('data-direction') === 'prev' ? -1 : 1;
            const target = document.querySelector(targetSelector);
            if (!target) return;
            const cardWidth = Number(target.getAttribute('data-card-width') || target.clientWidth);
            target.scrollBy({
                left: direction * (cardWidth + 24),
                behavior: 'smooth'
            });
        });
    });

    const confirmButton = document.querySelector('[data-confirm-booking]');
    const confirmPop = document.getElementById('bookingConfirm');
    const closeConfirm = document.querySelector('[data-close-confirm]');
    if (confirmButton && confirmPop) {
        confirmButton.addEventListener('click', () => {
            confirmPop.classList.remove('hidden');
        });
    }
    if (closeConfirm && confirmPop) {
        closeConfirm.addEventListener('click', () => {
            confirmPop.classList.add('hidden');
        });
    }
})();
