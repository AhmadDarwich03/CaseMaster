document.addEventListener('DOMContentLoaded', () => {
    const userDropdown = document.querySelector('.user-name');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (userDropdown) {
        userDropdown.addEventListener('click', () => {
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        });
    }
});
