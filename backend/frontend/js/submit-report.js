document.addEventListener("DOMContentLoaded", function () {
    const complaintForm = document.getElementById("complaintForm");
  
    if (complaintForm) {
      // Set the username in the hidden field when page loads
      const username = localStorage.getItem("username");
      const usernameInput = document.getElementById("usernameInput");
      
      console.log("Page loaded - Username from localStorage:", username);
      
      if (usernameInput && username) {
        usernameInput.value = username;
        console.log("Set username in hidden field:", username);
      } else {
        console.error("Username not found in localStorage or hidden field missing");
      }
  
      complaintForm.addEventListener("submit", handleFormSubmit);
    }
  });
  
  async function handleFormSubmit(e) {
    e.preventDefault();
    console.log("Form submission started");
  
    const submitBtn = document.getElementById("submitBtn");
    const responseEl = document.getElementById("response");
    const formData = new FormData(this);
  
    // Debug: Log all FormData entries before validation
    console.log("All FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
  
    // ✅ Validate file size (max 5MB)
    const file = formData.get("file");
    if (file && file.size > 5 * 1024 * 1024) {
      showErrorMessage(responseEl, "File size must be less than 5MB");
      return;
    }
  
    // ✅ Validate that username is present
    const username = formData.get("username");
    if (!username) {
      showErrorMessage(responseEl, "Error: No user session found. Please log in again.");
      return;
    }
  
    // ✅ Show loading state
    setButtonLoadingState(submitBtn, true);
    clearResponseMessage(responseEl);
  
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });
  
      const result = await response.json();
      console.log("Server response:", result);
  
      if (response.ok && result.success) {
        showSuccessMessage(responseEl, result.message);
        this.reset();
        lucide.createIcons();
  
        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = "user-dashboard.html";
        }, 3000);
      } else {
        throw new Error(result.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showErrorMessage(responseEl, `Error: ${error.message}`);
    } finally {
      setButtonLoadingState(submitBtn, false);
    }
  }
  
  /* ---------- Utility Functions ---------- */
  function setButtonLoadingState(button, isLoading) {
    if (!button) return;
  
    button.disabled = isLoading;
    const span = button.querySelector("span");
    const spinner = button.querySelector(".loading-spinner");
  
    if (span) span.style.display = isLoading ? "none" : "block";
    if (spinner) spinner.style.display = isLoading ? "flex" : "none";
  }
  
  function clearResponseMessage(responseEl) {
    if (responseEl) {
      responseEl.textContent = "";
      responseEl.className = "response-text";
    }
  }
  
  function showSuccessMessage(responseEl, message) {
    if (responseEl) {
      responseEl.textContent = message;
      responseEl.className = "response-text success";
    }
  }
  
  function showErrorMessage(responseEl, message) {
    if (responseEl) {
      responseEl.textContent = message;
      responseEl.className = "response-text error";
    }
  }