/* =========================================================
   LUNAWAT GEMS — WORKER CANDIDATE APPLICATION
   Single Page Form — Complete JavaScript
========================================================= */

/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let dependentCount = 0;

let toastTimer = null;

let photoDataUrl = "";


/* =========================================================
   ELEMENTS
========================================================= */

const fresher = document.getElementById("fresher");
const experienceArea = document.getElementById("experienceArea");

const sameAsPermanent =
    document.getElementById("sameAsPermanent");

const currentAddress =
    document.getElementById("currentAddress");

const permanentAddress =
    document.getElementById("permanentAddress");

const dependentArea =
    document.getElementById("dependentArea");

const declarationCheck =
    document.getElementById("declarationCheck");

const jobSource =
    document.getElementById("jobSource");

const referenceNameWrap =
    document.getElementById("referenceNameWrap");

const referenceIdWrap =
    document.getElementById("referenceIdWrap");

const photoFile =
    document.getElementById("photoFile");

const photoPreview =
    document.getElementById("photoPreview");

const photoUploadBtn =
    document.getElementById("photoUploadBtn");

const photoCaptureBtn =
    document.getElementById("photoCaptureBtn");

const photoRemoveBtn =
    document.getElementById("photoRemoveBtn");

const cameraModal =
    document.getElementById("cameraModal");

const cameraStream =
    document.getElementById("cameraStream");

const cameraCanvas =
    document.getElementById("cameraCanvas");

const cameraCloseBtn =
    document.getElementById("cameraCloseBtn");

const cameraCaptureBtn =
    document.getElementById("cameraCaptureBtn");

const cameraRetakeBtn =
    document.getElementById("cameraRetakeBtn");

const cameraSaveBtn =
    document.getElementById("cameraSaveBtn");

const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastMessage = document.getElementById("toastMessage");
const toastClose = document.getElementById("toastClose");


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "error") {
    clearTimeout(toastTimer);

    toast.classList.remove("success", "error", "warning");
    toast.classList.add(type);

    toastMessage.textContent = message;

    if (type === "success") {
        toastIcon.textContent = "✓";
    } else {
        toastIcon.textContent = "!";
    }

    toast.classList.add("show");

    toastTimer = setTimeout(hideToast, 4000);
}

function hideToast() {
    toast.classList.remove("show");
}

toastClose.addEventListener("click", hideToast);


/* =========================================================
   PHOTO UPLOAD
========================================================= */

photoUploadBtn.addEventListener("click", function () {
    photoFile.click();
});

photoFile.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    /* Validate type */

    if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file.");
        this.value = "";
        return;
    }

    /* Validate size (2 MB) */

    if (file.size > 2 * 1024 * 1024) {
        showToast("Photo size should not exceed 2 MB.");
        this.value = "";
        return;
    }

    /* Read as data URL */

    const reader = new FileReader();

    reader.onload = function (event) {
        photoDataUrl = event.target.result;

        photoPreview.innerHTML =
            `<img src="${photoDataUrl}" alt="Photo">`;

        photoRemoveBtn.classList.remove("hidden");

        showToast("Photo uploaded successfully.", "success");
    };

    reader.readAsDataURL(file);
});

photoRemoveBtn.addEventListener("click", function () {
    photoDataUrl = "";

    photoFile.value = "";

    photoPreview.innerHTML =
        `<span class="photo-placeholder">Photo</span>`;

    this.classList.add("hidden");

    showToast("Photo removed.", "success");
});


/* =========================================================
   LIVE CAMERA CAPTURE
========================================================= */

let cameraMediaStream = null;

let capturedImageData = "";


/* OPEN CAMERA */

photoCaptureBtn.addEventListener("click", async function () {

    /* Check browser support */

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {
        showToast(
            "Live camera is not supported on this device."
        );
        return;
    }

    try {
        cameraMediaStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

        cameraStream.srcObject = cameraMediaStream;

        cameraModal.classList.remove("hidden");

        /* Reset controls for fresh open */

        cameraCaptureBtn.classList.remove("hidden");
        cameraRetakeBtn.classList.add("hidden");
        cameraSaveBtn.classList.add("hidden");

        cameraStream.classList.remove("hidden");
        cameraCanvas.classList.add("hidden");

        capturedImageData = "";

    } catch (error) {
        console.error(error);

        showToast(
            "Unable to access camera. Please allow permission."
        );
    }
});


/* CAPTURE FRAME */

cameraCaptureBtn.addEventListener("click", function () {

    const video = cameraStream;
    const canvas = cameraCanvas;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
        showToast("Camera not ready. Please wait.");
        return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, width, height);

    capturedImageData = canvas.toDataURL("image/jpeg", 0.85);

    /* Show captured photo */

    video.classList.add("hidden");
    canvas.classList.remove("hidden");

    cameraCaptureBtn.classList.add("hidden");
    cameraRetakeBtn.classList.remove("hidden");
    cameraSaveBtn.classList.remove("hidden");
});


/* RETAKE */

cameraRetakeBtn.addEventListener("click", function () {

    capturedImageData = "";

    cameraStream.classList.remove("hidden");
    cameraCanvas.classList.add("hidden");

    cameraCaptureBtn.classList.remove("hidden");
    cameraRetakeBtn.classList.add("hidden");
    cameraSaveBtn.classList.add("hidden");
});


/* SAVE / USE THIS PHOTO */

cameraSaveBtn.addEventListener("click", function () {

    if (!capturedImageData) {
        showToast("Please capture a photo first.");
        return;
    }

    /* Check size (2 MB) */

    const approxBytes =
        (capturedImageData.length * 3) / 4;

    if (approxBytes > 2 * 1024 * 1024) {
        showToast(
            "Captured photo exceeds 2 MB. Please retake."
        );
        return;
    }

    /* Apply to preview */

    photoDataUrl = capturedImageData;

    photoPreview.innerHTML =
        `<img src="${photoDataUrl}" alt="Photo">`;

    photoRemoveBtn.classList.remove("hidden");

    /* Close modal and stop camera */

    closeCamera();

    showToast("Live photo captured successfully.", "success");
});


/* CLOSE CAMERA */

cameraCloseBtn.addEventListener("click", function () {
    closeCamera();
});


function closeCamera() {

    cameraModal.classList.add("hidden");

    if (cameraMediaStream) {
        cameraMediaStream
            .getTracks()
            .forEach((track) => track.stop());

        cameraMediaStream = null;
    }

    cameraStream.srcObject = null;

    capturedImageData = "";

    cameraStream.classList.remove("hidden");
    cameraCanvas.classList.add("hidden");

    cameraCaptureBtn.classList.remove("hidden");
    cameraRetakeBtn.classList.add("hidden");
    cameraSaveBtn.classList.add("hidden");
}


/* Close camera when clicking outside modal */

cameraModal.addEventListener("click", function (event) {
    if (event.target === cameraModal) {
        closeCamera();
    }
});


/* Close camera on Escape key */

document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        !cameraModal.classList.contains("hidden")
    ) {
        closeCamera();
    }
});


/* =========================================================
   SAME AS PERMANENT ADDRESS
========================================================= */

sameAsPermanent.addEventListener("change", function () {
    if (this.checked) {
        permanentAddress.value = currentAddress.value;
        permanentAddress.readOnly = true;
        permanentAddress.style.background = "#eeeeee";
    } else {
        permanentAddress.readOnly = false;
        permanentAddress.style.background = "#ffffff";
    }
});

currentAddress.addEventListener("input", function () {
    if (sameAsPermanent.checked) {
        permanentAddress.value = currentAddress.value;
    }
});


/* =========================================================
   FRESHER
========================================================= */

fresher.addEventListener("change", function () {
    if (this.checked) {
        experienceArea.classList.add("hidden");
    } else {
        experienceArea.classList.remove("hidden");
    }
});


/* =========================================================
   JOB SOURCE → REFERENCE FIELDS
========================================================= */

jobSource.addEventListener("change", function () {
    if (this.value === "Employee Reference") {
        referenceNameWrap.classList.remove("hidden");
        referenceIdWrap.classList.remove("hidden");
    } else {
        referenceNameWrap.classList.add("hidden");
        referenceIdWrap.classList.add("hidden");

        /* Clear values when hidden */

        document.getElementById("referenceName").value = "";
        document.getElementById("referenceId").value = "";
    }
});


/* =========================================================
   DEPENDENT INFORMATION
========================================================= */

function addDependent() {
    dependentCount++;

    const card = document.createElement("div");
    card.className = "dependent-card";

    card.innerHTML = `
        <div class="dependent-header">
            <h4>Dependent ${dependentCount}</h4>
            <span class="record-status">New</span>
        </div>

        <div class="dependent-grid">

            <div class="form-group">
                <label>
                    Member Name / सदस्य का नाम
                    <span>*</span>
                </label>
                <input
                    type="text"
                    class="memberName"
                    placeholder="Member Name">
            </div>

            <div class="form-group">
                <label>
                    Relationship / संबंध
                    <span>*</span>
                </label>
                <select class="relationship">
                    <option value="">Select Relationship</option>
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Spouse</option>
                    <option>Son</option>
                    <option>Daughter</option>
                    <option>Brother</option>
                    <option>Sister</option>
                    <option>Other</option>
                </select>
            </div>

            <div class="form-group">
                <label>
                    DOB / जन्म तिथि
                </label>
                <input type="date" class="dob">
            </div>

            <div class="form-group">
                <label>
                    Occupation / व्यवसाय
                </label>
                <select class="occupation">
                    <option value="">Select Occupation</option>
                    <option>Student</option>
                    <option>Employed</option>
                    <option>Self Employed</option>
                    <option>Homemaker</option>
                    <option>Retired</option>
                    <option>Other</option>
                </select>
            </div>

        </div>

        <div class="dependent-action">
            <button type="button" class="cancel-new-btn">
                CANCEL
            </button>

            <button type="button" class="save-dependent-btn">
                SAVE
            </button>
        </div>
    `;

    dependentArea.appendChild(card);

    card.querySelector(".cancel-new-btn").addEventListener(
        "click",
        function () {
            card.remove();
            showToast("Dependent removed.", "success");
        }
    );

    card.querySelector(".save-dependent-btn").addEventListener(
        "click",
        function () {
            saveDependentCard(card);
        }
    );

    card.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function saveDependentCard(card) {
    const memberName = card.querySelector(".memberName");
    const relationship = card.querySelector(".relationship");

    clearCardErrors(card);

    if (!memberName.value.trim()) {
        markError(memberName);
        showToast("Please enter Member Name.");
        memberName.focus();
        return;
    }

    if (!relationship.value) {
        markError(relationship);
        showToast("Please select Relationship.");
        relationship.focus();
        return;
    }

    card.querySelectorAll("input, select").forEach((field) => {
        field.disabled = true;
    });

    const status = card.querySelector(".record-status");
    if (status) {
        status.textContent = "Saved";
        status.classList.add("saved");
    }

    const action = card.querySelector(".dependent-action");

    action.innerHTML = `
        <button type="button" class="remove-dependent-btn">
            REMOVE
        </button>
    `;

    action.querySelector(".remove-dependent-btn").addEventListener(
        "click",
        function () {
            card.remove();
            showToast("Dependent removed.", "success");
        }
    );

    showToast("Dependent saved successfully.", "success");
}


document.getElementById("addDependentBtn").addEventListener(
    "click",
    function () {
        addDependent();
    }
);


/* =========================================================
   MARK ERROR
========================================================= */

function markError(element) {
    if (!element) return;

    element.classList.add("input-error");

    element.addEventListener("input", removeError, { once: true });
    element.addEventListener("change", removeError, { once: true });
}

function removeError(event) {
    event.target.classList.remove("input-error");
}

function clearCardErrors(container) {
    if (!container) return;

    container.querySelectorAll(".input-error").forEach((element) => {
        element.classList.remove("input-error");
    });
}


/* =========================================================
   VALIDATION (ALL FIELDS AT ONCE)
========================================================= */

function validateForm() {

    const body = document.body;
    clearCardErrors(body);

    /* ---- Photo ---- */

    if (!photoDataUrl) {
        showToast("Please upload your photo.");
        photoUploadBtn.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        return false;
    }

    /* ---- Aadhaar ---- */

    const aadhaarNumber = document.getElementById("aadhaarNumber");
    const aadhaarFile = document.getElementById("aadhaarFile");

    if (!aadhaarNumber.value.trim()) {
        markError(aadhaarNumber);
        showToast("Please enter Aadhaar Number.");
        aadhaarNumber.focus();
        return false;
    }

    if (!/^\d{12}$/.test(aadhaarNumber.value.trim())) {
        markError(aadhaarNumber);
        showToast("Aadhaar Number must be exactly 12 digits.");
        aadhaarNumber.focus();
        return false;
    }

    if (!aadhaarFile.files.length) {
        showToast("Please upload e-Aadhaar file.");
        aadhaarFile.focus();
        return false;
    }

    /* ---- Candidate ---- */

    const name = document.getElementById("candidateName");
    const email = document.getElementById("email");
    const contact = document.getElementById("contact");
    const emergencyName = document.getElementById("emergencyName");
    const emergencyContact = document.getElementById("emergencyContact");
    const dob = document.getElementById("dob");
    const nationality = document.getElementById("nationality");
    const gender = document.getElementById("gender");
    const marital = document.getElementById("maritalStatus");
    const currAddr = document.getElementById("currentAddress");
    const permAddr = document.getElementById("permanentAddress");

    const required = [
        [name, "Please enter Candidate Name."],
        [email, "Please enter Email."],
        [contact, "Please enter Contact Number."],
        [emergencyName, "Please enter Emergency Person Name."],
        [emergencyContact, "Please enter Emergency Contact Number."],
        [dob, "Please select Date of Birth."],
        [nationality, "Please select Nationality."],
        [gender, "Please select Gender."],
        [marital, "Please select Marital Status."],
        [currAddr, "Please enter Current Address."],
        [permAddr, "Please enter Permanent Address."]
    ];

    for (const [field, message] of required) {
        if (!field.value.trim()) {
            markError(field);
            showToast(message);
            field.focus();
            return false;
        }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        markError(email);
        showToast("Please enter a valid email address.");
        email.focus();
        return false;
    }

    if (!/^[6-9]\d{9}$/.test(contact.value.trim())) {
        markError(contact);
        showToast("Please enter a valid 10 digit contact number.");
        contact.focus();
        return false;
    }

    if (!/^[6-9]\d{9}$/.test(emergencyContact.value.trim())) {
        markError(emergencyContact);
        showToast("Please enter a valid 10 digit emergency contact number.");
        emergencyContact.focus();
        return false;
    }

    /* ---- Education ---- */

    const qualification = document.getElementById("qualification");

    if (!qualification.value) {
        markError(qualification);
        showToast("Please select Qualification.");
        qualification.focus();
        return false;
    }

    /* ---- Additional ---- */

    const disability = document.getElementById("disability");
    const distance = document.getElementById("distance");

    if (!disability.value) {
        markError(disability);
        showToast("Please select Disability Info.");
        disability.focus();
        return false;
    }

    if (!distance.value) {
        markError(distance);
        showToast("Please enter Distance to Office.");
        distance.focus();
        return false;
    }

    if (!jobSource.value) {
        markError(jobSource);
        showToast("Please select Job Source.");
        jobSource.focus();
        return false;
    }

    /* ---- Reference (only if Employee Reference) ---- */

    if (jobSource.value === "Employee Reference") {

        const refName = document.getElementById("referenceName");
        const refId = document.getElementById("referenceId");

        if (!refName.value.trim()) {
            markError(refName);
            showToast("Please enter Reference Name.");
            refName.focus();
            return false;
        }

        if (!refId.value.trim()) {
            markError(refId);
            showToast("Please enter Reference Employee ID.");
            refId.focus();
            return false;
        }
    }

    /* ---- Declaration ---- */

    if (!declarationCheck.checked) {
        showToast(
            "Please accept the declaration before submitting."
        );
        declarationCheck.focus();
        return false;
    }

    return true;
}


/* =========================================================
   COLLECT DATA
========================================================= */

function collectApplicationData() {
    return {

        photo: photoDataUrl ? "uploaded" : "",

        aadhaar: {
            number: getValue("aadhaarNumber"),
            fileUploaded:
                document.getElementById("aadhaarFile").files.length > 0
        },

        candidate: {
            name: getValue("candidateName"),
            email: getValue("email"),
            contact: getValue("contact"),
            emergencyName: getValue("emergencyName"),
            emergencyContact: getValue("emergencyContact"),
            dob: getValue("dob"),
            nationality: getValue("nationality"),
            gender: getValue("gender"),
            bloodGroup: getValue("bloodGroup"),
            maritalStatus: getValue("maritalStatus"),
            currentAddress: getValue("currentAddress"),
            permanentAddress: getValue("permanentAddress")
        },

        experience: {
            fresher: fresher.checked,
            lastCompany: getValue("lastCompany"),
            totalExperience: getValue("totalExperience"),
            lastSalary: getValue("lastSalary"),
            expectedSalary: getValue("expectedSalary")
        },

        education: {
            qualification: getValue("qualification")
        },

        dependents: collectDependents(),

        additional: {
            disability: getValue("disability"),
            military: getValue("military"),
            distance: getValue("distance"),
            jobSource: getValue("jobSource"),
            referenceName: getValue("referenceName"),
            referenceId: getValue("referenceId")
        },

        declarationAccepted: declarationCheck
            ? declarationCheck.checked
            : false
    };
}


/* =========================================================
   COLLECT DEPENDENTS
========================================================= */

function collectDependents() {
    return Array.from(
        dependentArea.querySelectorAll(".dependent-card")
    ).map((card) => ({
        memberName: getCardValue(card, ".memberName"),
        relationship: getCardValue(card, ".relationship"),
        dob: getCardValue(card, ".dob"),
        occupation: getCardValue(card, ".occupation")
    }));
}


/* =========================================================
   GET CARD VALUE
========================================================= */

function getCardValue(card, selector) {
    const element = card.querySelector(selector);
    return element ? element.value : "";
}


/* =========================================================
   GET VALUE
========================================================= */

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
}


/* =========================================================
   SUBMIT
========================================================= */

document.getElementById("submitBtn").addEventListener(
    "click",
    function () {

        if (!validateForm()) return;

        const data = collectApplicationData();

        console.log("FINAL WORKER APPLICATION DATA:", data);

        /*
           Replace this section later with your
           Google Apps Script / API submission.
        */

        showToast(
            "Application submitted successfully.",
            "success"
        );
    }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* Add one empty dependent card on start */

    addDependent();

    /* Clear any old drafts — always start fresh */

    localStorage.removeItem("lunawat_worker_draft");
});