function openMenu() {
    var elem = document.getElementById("menu");
    setTimeout(function (elem) {
        if (elem.classList.contains("hide")) {
            elem.classList.remove("hide");
        } else {
            elem.classList.add("hide");
        }
    }.bind(this, elem), 10);
}