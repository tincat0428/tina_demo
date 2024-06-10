const RWD_BREAK_POINT = 765;
const WEB_HEADER_HEIGHT = 70;

let device, acctPage = false, modalOpen = false;

window.onload = () => {
    AppInt();
};

const AppInt = () => {
    RWD();
    tooltips();
    dateSelector();
    dropdown();
}

// show modal
const modal = (target, bool) => {
    modalOpen = bool;
    const targetElem = document.querySelector(target);
    targetElem.classList.toggle('active', modalOpen);

    if (modalOpen) {
        document.body.style.overflow = 'hidden';
        targetElem.addEventListener('click', function (event) {
            // 確保點擊的是 Modal 本體而不是它的內容
            if (event.target === targetElem) {
                modal(target, false);
            }
        })
    } else {
        document.body.style = '';
    }
}
// open more info 
const eventMore = (target) => {
    if (device == 'web') {
        event.target.classList.toggle('icon-close_circle')
        event.target.classList.toggle('icon-info')
        toggleClass(target, 'active');
    } else {
        modal('#modal-0', true)
    }
}
// click toggle classname
const toggleClass = (target, classname) => {
    const targetElem = document.querySelector(target);
    targetElem.classList.toggle(classname)
}

// account page open
const showAcctPage = (bool) => {
    acctPage = bool;
    const pageElem = document.querySelector('#acct-page')
    pageElem.classList.toggle('hidden', !acctPage);
    // 滾動控制
    if (acctPage) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style = '';
    }

    if (device == 'mobile') {
        document.querySelector('header').classList.toggle('hidden', acctPage);
        document.querySelector('.index').classList.toggle('hidden', acctPage);
    }

}
// change tab
const changeModalTab = (target, activeIndex = 0) => {
    const tabActiveClass = 'active'
    const contents = document.querySelectorAll(target);
    const tabClass = event.currentTarget.classList[0]
    const tabs = document.querySelectorAll(`.${tabClass}`);

    contents.forEach((elem, i) => {
        if (i == activeIndex) {
            elem.style = ''
            tabs[i].classList.add(tabActiveClass)
        } else {
            elem.style = 'display: none';
            tabs[i].classList.remove(tabActiveClass)
        }
    })
}
// dropdown toggle
const dropdown = () => {
    const dropdowns = document.querySelectorAll('[data-dropdown]');
    const body = document.body;
    if (dropdowns.length > 0) {
        dropdowns.forEach(item => {
            const target = item.getAttribute('data-dropdown')
            const list = document.querySelector(target);
            if (list) {
                item.onclick = (e) => {
                    e.stopPropagation();
                    list.classList.toggle('active')
                }
            }
        })
        body.onclick = (event) => {
            dropdowns.forEach(item => {
                const target = item.getAttribute('data-dropdown');
                const list = document.querySelector(target);
                list.classList.remove('active');
            })
        }
    }

}
// only mobile/web todo
const handleClick = (onlyDevice, callback) => {
    if (onlyDevice == device) {
        callback();
    }
}
// open detail
const openDetail = (target, scrollInner) => {
    const container = document.querySelector(scrollInner)
    toggleClass(target, 'open');

    setTimeout(() => {
        const detailElem = document.querySelector(target);
        container.scrollTop = detailElem.offsetTop;
    }, 150)
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

// tooltip 
const tooltips = () => {
    if (device == 'mobile') return;
    const tooltips = document.querySelectorAll('[data-tooltip]');
    const tooltipElem = document.querySelector('#tooltip')

    if (tooltips.length > 0) {
        tooltips.forEach(item => {
            item.addEventListener('mouseover', () => {
                const str = item.getAttribute('data-tooltip')
                const postition = item.getBoundingClientRect();
                tooltipElem.innerHTML = str
                tooltipElem.classList.add('active');
                tooltipElem.style = `top: ${postition.bottom + 5}px; left: ${postition.left - postition.width / 2}px`
            })

            item.addEventListener('mouseout', () => {
                tooltipElem.classList.remove('active')
            })
        })
    }
}

// date input
const dateSelector = () => {
    flatpickr("#dateInput", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: ["2016-10-10", "2016-10-20"]
    });
}