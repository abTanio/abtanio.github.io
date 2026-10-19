
/*==================== SHOW MENU ====================*/
const showMenu = (toggleId, navId) => {
    const toggle = document.getElementById(toggleId);
    const nav = document.getElementById(navId);

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('show-menu');
        });
    }
};

showMenu('nav-toggle', 'nav-menu');


/*==================== REMOVE MENU MOBILE ====================*/
const navLinks = document.querySelectorAll('.nav__link');

function linkAction() {
    const navMenu = document.getElementById('nav-menu');

    if (navMenu) {
        navMenu.classList.remove('show-menu');
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', linkAction);
});


/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]');

function scrollActive() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 50;
        const sectionId = section.getAttribute('id');

        const activeLink = document.querySelector(
            `.nav__menu a[href="#${sectionId}"]`
        );

        if (!activeLink) return;

        if (
            scrollY > sectionTop &&
            scrollY <= sectionTop + sectionHeight
        ) {
            activeLink.classList.add('active-link');
        } else {
            activeLink.classList.remove('active-link');
        }
    });
}

window.addEventListener('scroll', scrollActive);


/*==================== SHOW SCROLL TOP ====================*/
function scrollTop() {
    const scrollTopButton = document.getElementById('scroll-top');

    if (!scrollTopButton) return;

    if (window.scrollY >= 200) {
        scrollTopButton.classList.add('show-scroll');
    } else {
        scrollTopButton.classList.remove('show-scroll');
    }
}

window.addEventListener('scroll', scrollTop);


/*==================== DARK LIGHT THEME ====================*/
const themeButton = document.getElementById('theme-button');
const darkTheme = 'dark-theme';
const iconTheme = 'bx-sun';

const getCurrentTheme = () =>
    document.body.classList.contains(darkTheme) ? 'dark' : 'light';

const getCurrentIcon = () =>
    themeButton && themeButton.classList.contains(iconTheme)
        ? 'bx-moon'
        : 'bx-sun';

const selectedTheme = localStorage.getItem('selected-theme');
const selectedIcon = localStorage.getItem('selected-icon');

// Restore previously selected theme
if (selectedTheme) {
    document.body.classList.toggle(
        darkTheme,
        selectedTheme === 'dark'
    );
}

if (themeButton && selectedIcon) {
    themeButton.classList.toggle(
        iconTheme,
        selectedIcon === 'bx-moon'
    );
}

// Toggle theme
if (themeButton) {
    themeButton.addEventListener('click', () => {
        document.body.classList.toggle(darkTheme);
        themeButton.classList.toggle(iconTheme);

        localStorage.setItem('selected-theme', getCurrentTheme());
        localStorage.setItem('selected-icon', getCurrentIcon());
    });
}


/*==================== SAVE CV AS A ONE-PAGE PDF ====================*/
/*
  Opens the browser's print window with the CV already fitted on one A4 page.
  Choose "Save as PDF" as the destination. The PDF keeps real text, your photo
  and the links, and it works even when cv.html is opened as a file.
*/

const PDF_TITLE = 'ATanio_CV';       // suggested file name
const PAGE_W_PX = 793.7;             // A4 width (210 mm) in pixels
const PAGE_H_PX = 1118.7;            // A4 height used (296 mm) in pixels
const START_WIDTH = 794;             // first width tried for the CV
const MAX_WIDTH = 1400;              // never make the CV wider than this


// Makes a copy of the CV that always uses the light, compact layout
function createPrintPage() {
    const page = document.createElement('div');
    page.className = 'print-page';

    const sheet = document.createElement('div');
    sheet.className = 'pdf-mode scale-cv';

    const copy = document.getElementById('area-cv').cloneNode(true);
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    copy
        .querySelectorAll('.change-theme, .generate-pdf, .home__button-movil')
        .forEach((el) => el.remove());

    sheet.appendChild(copy);
    page.appendChild(sheet);
    document.body.appendChild(page);

    return { page, sheet };
}


// Makes the CV wider until all of it fits on one page, then shrinks it to the page width
function fitToOnePage(sheet) {
    const pageRatio = PAGE_H_PX / PAGE_W_PX;
    let width = START_WIDTH;
    sheet.style.width = width + 'px';

    while (sheet.offsetHeight > width * pageRatio * 0.97 && width < MAX_WIDTH) {
        width += 8;
        sheet.style.width = width + 'px';
    }

    const scale = PAGE_W_PX / width;
    sheet.style.transform = 'scale(' + scale + ')';

    // Stretch the grey column down to the bottom of the page
    sheet.style.setProperty('--sheet-min-height', PAGE_H_PX / scale + 'px');
}


// Waits until every image inside the element has loaded
function waitForImages(element) {
    const images = Array.from(element.querySelectorAll('img'));

    return Promise.all(
        images.map((img) =>
            img.complete
                ? Promise.resolve()
                : new Promise((resolve) => {
                      img.onload = resolve;
                      img.onerror = resolve;
                  })
        )
    );
}


document.addEventListener('DOMContentLoaded', () => {
    const cv = document.getElementById('area-cv');
    const buttons = document.querySelectorAll(
        '#resume-button, #resume-button-mobile'
    );

    if (!cv || buttons.length === 0) {
        console.error('CV container or download button was not found.');
        return;
    }

    let isBusy = false;

    const saveCv = async (event) => {
        event.preventDefault();

        if (isBusy) return;
        isBusy = true;

        const originalTitle = document.title;
        let page;

        const cleanUp = () => {
            window.removeEventListener('afterprint', cleanUp);
            document.body.classList.remove('printing-cv');
            document.title = originalTitle;
            if (page) page.remove();
            isBusy = false;
        };

        try {
            // Wait for fonts and icons so they appear in the PDF
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            const created = createPrintPage();
            page = created.page;

            await waitForImages(created.sheet);
            fitToOnePage(created.sheet);

            document.title = PDF_TITLE;
            document.body.classList.add('printing-cv');
            window.addEventListener('afterprint', cleanUp);

            window.print();
        } catch (error) {
            console.error('Could not prepare the PDF:', error);
            cleanUp();
        }
    };

    buttons.forEach((button) => button.addEventListener('click', saveCv));
});
