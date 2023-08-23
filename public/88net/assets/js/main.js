const RWD_BREAK_POINT = 765;
const WEB_HEADER_HEIGHT = 70;
const ROUTER = [
    { name: 'Home', link: './', menu: true },
    { name: 'About', link: './about.html', menu: true },
    { name: 'Product', link: './product.html', menu: true },
    { name: 'Contact', link: './contact.html', menu: true },
]

let device;
let pageNow;

$(document).ready(function () {
    AppInt();
});

const AppInt = () => {
    RWD();
    // new Header();
    new GoTopBtn();
    if (Page) Page.init();
    loadingFinish();
}

// RWD
const RWD = () => {
    device = (window.innerWidth <= RWD_BREAK_POINT || window.screen.width <= RWD_BREAK_POINT) ? 'mobile' : 'web';
    let elems = document.querySelectorAll('*[data-device]');
    document.querySelector('body').classList.add(device)

    elems.forEach((elem) => {
        const elemDevice = elem.getAttribute('data-device');
        if (elemDevice != device) {
            elem.remove()
        }
    })

    window.addEventListener('resize', () => {
        let new_device = (window.innerWidth <= RWD_BREAK_POINT || window.screen.width <= RWD_BREAK_POINT) ? 'mobile' : 'web';
        if (device != new_device) {
            window.location.reload();
        }
    })
}

// loading
const loadingFinish = () => {
    let loadingMask = document.querySelector('#loader');
    let allImg = document.querySelectorAll('img')
    document.querySelector('body').classList.add('no-scroll');
    imgSrc();
    counter = 0;
    allImg.forEach(img => {
        if (img.complete)
            incrementCounter();
        else
            img.addEventListener('load', incrementCounter, false);
    })

    function incrementCounter() {
        counter++;
        if (counter === allImg.length) {
            setTimeout(() => {
                window.scrollTo(0, 0);
                loadingMask.classList.add('active');
                document.querySelector('body').classList.remove('no-scroll');
                AOS.init({ duration: 1000, once: true, offset: (device == 'mobile') ? -100 : 0 });
            }, 300)
        }
    }
}
// img src
const imgSrc = () => {
    let pics = document.querySelectorAll('*[data-src]');
    if (pics) {
        pics.forEach(pic => {
            const src = pic.getAttribute('data-src');
            pic.src = src;
        })
    }
}

// --- Components --- //
// header
class Header {
    constructor(page) {
        this.pageNow = page;
        this.init();
    }
    pageNow

    LOGO_CLASS = 'nav-logo';
    NAV_CLASS = 'nav';
    MENU_CLASS = 'nav-menu';
    MENU_ITEM_TEMPLATE_ID = 'nav-menu-item';
    MOBILE_MENU_BTN_CLASS = 'burger-btn';

    navMenu = document.querySelector('.' + this.MENU_CLASS);
    logo = document.querySelector('.' + this.LOGO_CLASS);

    init() {
        this.createNavMenu();
        window.addEventListener('scroll', this.navScrollChange.bind(this));
        if (device === 'mobile') this.sideNavToggle();
    }

    createNavMenu() {
        const template = document.getElementById(this.MENU_ITEM_TEMPLATE_ID);
        const navMenuItems = ROUTER.map((item) => {
            if (!item.menu) return;
            const clone = template.content.cloneNode(true);
            const a = clone.querySelector('a');
            a.textContent = item.name;
            a.href = item.link;
            if (this.pageNow == item.name) a.classList.add('active');
            this.navMenu.appendChild(clone);
        });
    }

    navScrollChange() {
        const nav = document.querySelector("." + this.NAV_CLASS);
        let scrolling = $(window).scrollTop() > 20;
        nav.classList.toggle('scroll', scrolling);
    }
    // show mobile nav
    sideNavToggle() {
        const menuBtn = document.querySelector("." + this.MOBILE_MENU_BTN_CLASS);
        menuBtn.addEventListener('click', () => {
            this.navMenu.classList.toggle("active");
        });
    };
}

// go top btn
class GoTopBtn {
    constructor() {
        window.addEventListener('scroll', this.scrollHandler.bind(this))
    }

    scrollHandler() {
        const windowH = window.innerHeight / 4;
        const gpTopBtn = document.querySelector('.go-top-btn')
        if (document.body.scrollTop > windowH || document.documentElement.scrollTop > windowH) {
            gpTopBtn.classList.add('active');
        } else {
            gpTopBtn.classList.remove('active');
        }
    }
}
// --- Pages --- //
// common 
class CommonPage {
    constructor() { }

    init() {
        return null;
    }

    createGallery({ containerClass, templateId, data }) {
        const template = document.getElementById(templateId);
        const container = document.querySelector('.' + containerClass);
        const Items = data.map((item) => {
            const clone = template.content.cloneNode(true);
            const img = clone.querySelector('.img img');
            const icon = clone.querySelector('.icon')
            const link = clone.querySelector('.link');
            const title = clone.querySelector('.title');
            const content = clone.querySelector('.text');
            title.innerHTML = item.title
            if (img) img.src = item.img;
            if (link) link.href = item.link;
            if (icon) icon.classList.add(item.icon);
            if (content) content.innerHTML = item.content;
            container.appendChild(clone);
        });
    }
}

// Home
class Home extends CommonPage {
    init() {
        const header = new Header('Home');
        this.createGallery({ ...SERVICE_DATA });
        const mask = new Sketch('.bottom-bg')
    }
}

class About extends CommonPage {
    init() {
        const header = new Header('About');
        this.createGallery({ ...ABOUT_DATA })
        this.createGallery({ ...SERVICE_DATA })
        const mask1 = new Sketch('.kv')
        const mask2 = new Sketch('.bottom-bg')
    }
}

class Product extends CommonPage {
    SUPPORT_ITEM_TARGET = '.support-item'

    init() {
        const header = new Header('Product');
        this.createGallery({ ...PRODUCT_INFO_DATA })
        this.createGallery({ ...SUPPORT_DATA })
        const mask1 = new Sketch('.sec-wrap');
        const mask2 = new Sketch('.bottom-bg');
        this.supportItemSketch();
    }

    supportItemSketch() {
        const supportItemElem = document.querySelectorAll(this.SUPPORT_ITEM_TARGET);
        supportItemElem.forEach((item, i) => {
            const itemMask = new Sketch(`${this.SUPPORT_ITEM_TARGET}:nth-of-type(${i + 1})>.img`)
        })
    }
}

class Contact extends CommonPage {
    init() {
        const header = new Header('Contact');
        const mask = new Sketch('.sec');
        form.addEventListener('keyup', this.submitValid);
        this.sendEmail();
    }

    submitValid() {
        let form = document.getElementById('form');
        let formValue = new FormData(form)
        let nameInput = formValue.get('name');
        let emailInput = formValue.get('email');
        let active = (nameInput.length > 0 && emailInput.length > 0);
        form.querySelector('button').classList.toggle(active);
        form.querySelector('button').disabled = !active;
    }

    sendEmail() {
        let name = document.getElementById("name").value
        let email = document.getElementById("email").value
        let phone = document.getElementById("phone").value
        let message = document.getElementById("message").value
        let body
        let mailTo

        function verifyEmail(email) {
            if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*$/.test(email)) {
                return (true)
            }
            alert('Please enter complete information.')
            return (false)
        }

        body = "My name: " + name + "%0d%0a" + "My phone: " + phone + "%0d%0a" + "My email address: " + email + "%0d%0a" + "Message: " + message;
        mailTo = "mailto:info@ctech.com.my?subject=message&body=" + body;

        if (name && verifyEmail(email) && message) {
            document.getElementById("send").setAttribute("href", mailTo);
            document.getElementById("send").click();
            event.preventDefault();
            window.location = window.location.href.split("?")[0];
        } else {
            document.getElementById("form").addEventListener('submit', function () {
                event.preventDefault();
            });
        }
    }
}