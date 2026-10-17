
const loginButton = document.querySelector(".login-btn");
const getStartedButton = document.querySelector(".get-started-btn");
const loginForm = document.querySelector("#loginForm");

// HOME → LOGIN
if (loginButton) {
    loginButton.addEventListener("click", function () {
        window.location.href = "login.html";
    });
}

if (getStartedButton) {
    getStartedButton.addEventListener("click", function () {
        window.location.href = "login.html";
    });
}

// LOGIN → DASHBOARD
if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (loginForm.checkValidity()) {
            window.location.href = "dashboard.html";
        } else {
            loginForm.reportValidity();
        }
    });
}


document.addEventListener("DOMContentLoaded", function () {
    const addButton = document.getElementById("addStudentBtn");
    const modal = document.getElementById("studentModal");
    const closeButton = document.getElementById("closeStudentModal");
    const cancelButton = document.getElementById("cancelStudentBtn");
    const form = document.getElementById("addStudentForm");

    // Check required elements
    if (!addButton || !modal) {
        console.error(
            "Add Student button or modal not found. Check students.html IDs."
        );
        return;
    }

    // Open modal
    addButton.addEventListener("click", function () {
        modal.hidden = false;
        modal.style.display = "flex";

        const firstInput = document.getElementById("newStudentId");
        if (firstInput) firstInput.focus();
    });

    // Close modal
    function closeModal() {
        modal.hidden = true;
        modal.style.display = "none";

        if (form) form.reset();
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeModal);
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", closeModal);
    }

    // Close when clicking outside the modal
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Close with Escape key
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    console.log("Add Student modal initialized successfully.");
});
