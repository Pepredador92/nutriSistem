// js/main.js
// Script para la página principal (index.html)

document.addEventListener("DOMContentLoaded", () => {
  console.log("NutriSistem Home Page Loaded");

  // Ejemplo: Smooth scroll para el botón "Conoce Más"
  const conoceMasButton = document.querySelector('a[href="#conoce-mas"]');
  if (conoceMasButton) {
    conoceMasButton.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
});
