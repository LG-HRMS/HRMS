/* =========================================================
   LUNAWAT GEMS
   CANDIDATE APPLICATION
   Complete JavaScript
========================================================= */

/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentStep = 1;
const totalSteps = 4;

const stepTitles = [
    "Basic Details",
    "Experience Information",
    "Education Information",
    "Additional Information"
];

let relevantCount = 0;
let otherCount = 0;
let educationCount = 0;

let skills = [];
let certificates = [];

let toastTimer = null;
let draftTimer = null;

/* =========================================================
   ELEMENTS
========================================================= */

const entryCard          = document.getElementById("entryCard");
const application        = document.getElementById("application");
const resumeBtn          = document.getElementById("resumeBtn");
const manualBtn          = document.getElementById("manualBtn");
const resumeFile         = document.getElementById("resumeFile");
const parseStatus        = document.getElementById("parseStatus");
const fresher            = document.getElementById("fresher");
const experienceArea     = document.getElementById("experienceArea");
const source             = document.getElementById("source");
const referenceWrap      = document.getElementById("referenceWrap");
const lastSalaryWrap     = document.getElementById("lastSalaryWrap");
const expectedSalaryWrap = document.getElementById("expectedSalaryWrap");
const toast              = document.getElementById("toast");
const toastIcon          = document.getElementById("toastIcon");
const toastMessage       = document.getElementById("toastMessage");
const toastClose         = document.getElementById("toastClose");

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
    } else if (type === "warning") {
        toastIcon.textContent = "!";
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
   START - MANUAL
========================================================= */

manualBtn.addEventListener("click", function () {
    startApplication();
    showToast("Manual application started.", "success");
});

/* =========================================================
   START - RESUME
========================================================= */

resumeBtn.addEventListener("click", function () {
    resumeFile.click();
});

/* =========================================================
   RESUME FILE SELECTED
========================================================= */

resumeFile.addEventListener("change", async function () {
    const file = this.files[0];

    if (!file) return;

    const extension = "." + file.name.split(".").pop().toLowerCase();

    const allowedExtensions = [".pdf", ".doc", ".docx", ".txt"];

    if (!allowedExtensions.includes(extension)) {
        showToast("Please upload PDF, DOC or DOCX resume.");
        this.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast("Resume size should not exceed 5 MB.");
        this.value = "";
        return;
    }

    startApplication();

    parseStatus.classList.remove("hidden");
    parseStatus.textContent = "Reading resume. Please wait...";

    try {
        const text = await readResume(file);

        if (!text.trim()) {
            throw new Error("No readable text found.");
        }

        autoFillFromResume(text);

        parseStatus.textContent =
            "Resume information has been pre-filled. Please review and correct the information before continuing.";

        showToast("Resume data loaded. Please review the form.", "success");
    } catch (error) {
        console.error(error);

        parseStatus.textContent =
            "Resume could not be read automatically. Please enter the information manually.";

        showToast(
            "Resume could not be parsed. You can continue with manual entry.",
            "warning"
        );
    }
});

/* =========================================================
   START APPLICATION
========================================================= */

function startApplication() {
    entryCard.classList.add("hidden");
    application.classList.remove("hidden");

    initializeForms();
    updateStep();
}

/* =========================================================
   INITIALIZE
========================================================= */

function initializeForms() {
    if (
        document.getElementById("relevantExperience").children.length === 0
    ) {
        addExperience("relevant");
    }

    if (
        document.getElementById("otherExperience").children.length === 0
    ) {
        addExperience("other");
    }

    if (document.getElementById("educationArea").children.length === 0) {
        addEducation();
    }
}

/* =========================================================
   RESUME READING
========================================================= */

async function readResume(file) {
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "txt") {
        return await file.text();
    }

    if (extension === "docx") {
        if (typeof mammoth === "undefined") {
            throw new Error("DOCX parser unavailable.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    }

    if (extension === "pdf") {
        if (typeof pdfjsLib === "undefined") {
            throw new Error("PDF parser unavailable.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = "";

        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
            const page = await pdf.getPage(pageNo);
            const content = await page.getTextContent();
            text +=
                content.items.map((item) => item.str).join(" ") + "\n";
        }

        return text;
    }

    throw new Error("Unsupported resume type.");
}

/* =========================================================
   AUTO FILL RESUME
========================================================= */

function autoFillFromResume(text) {
    const cleanText = text.replace(/\s+/g, " ").trim();

    if (!cleanText) return;

    /* EMAIL */
    const emailMatch = cleanText.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );
    if (emailMatch) setValue("email", emailMatch[0]);

    /* MOBILE */
    const mobileMatch = cleanText.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
    if (mobileMatch) {
        const mobile = mobileMatch[0].replace(/\D/g, "").slice(-10);
        setValue("contact", mobile);
    }

    /* NAME */
    const name = extractName(text);
    if (name) setValue("candidateName", name);

    /* ADDRESS */
    const address = extractAfterLabel(cleanText, [
        "address",
        "current address",
        "residential address"
    ]);
    if (address) setValue("address", address);

    /* GENDER */
    if (/\bfemale\b/i.test(cleanText)) {
        setValue("gender", "Female");
    } else if (/\bmale\b/i.test(cleanText)) {
        setValue("gender", "Male");
    }

    /* NATIONALITY */
    if (/\bindian\b/i.test(cleanText)) {
        setValue("nationality", "Indian");
    }
}

/* =========================================================
   NAME EXTRACTION
========================================================= */

function extractName(text) {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];

        if (
            line.length >= 3 &&
            line.length <= 60 &&
            !/@/.test(line) &&
            !/\d{5,}/.test(line) &&
            !/resume|curriculum vitae|cv/i.test(line)
        ) {
            return line;
        }
    }

    return "";
}

/* =========================================================
   LABEL EXTRACTION
========================================================= */

function extractAfterLabel(text, labels) {
    for (const label of labels) {
        const regex = new RegExp(
            label + "\\s*[:\\-]\\s*([^\\n|]+)",
            "i"
        );
        const match = text.match(regex);

        if (match) {
            return match[1].trim().slice(0, 250);
        }
    }

    return "";
}

/* =========================================================
   SET VALUE
========================================================= */

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element && value) element.value = value;
}

/* =========================================================
   ADD EXPERIENCE
   Relevant → NO Industry field
   Other    → WITH Industry field
   New card → shows SAVE + CANCEL
========================================================= */

function addExperience(type) {
    const container = document.getElementById(
        type === "relevant" ? "relevantExperience" : "otherExperience"
    );

    const count = type === "relevant" ? ++relevantCount : ++otherCount;

    const card = document.createElement("div");

    card.className =
        type === "relevant"
            ? "experience-card relevant-card"
            : "experience-card other-card";

    const industryField =
        type === "other"
            ? `
            <!-- INDUSTRY (Other Experience only) -->
            <div class="form-group">
                <label>
                    Industry
                    <span>*</span>
                </label>
                <input
                    type="text"
                    class="industry"
                    placeholder="Industry">
            </div>
            `
            : "";

    card.innerHTML = `
        <div class="experience-header">
            <h4>
                ${
                    type === "relevant"
                        ? "Relevant Experience"
                        : "Other Experience"
                }
                ${count}
            </h4>
            <span class="record-status">New</span>
        </div>

        <div class="exp-grid">

            <!-- COMPANY NAME -->
            <div class="form-group">
                <label>Company Name <span>*</span></label>
                <input type="text" class="company" placeholder="Company Name">
            </div>

            <!-- START DATE -->
            <div class="form-group">
                <label>Start Date <span>*</span></label>
                <input type="date" class="startDate">
            </div>

            <!-- END DATE -->
            <div class="form-group">
                <label>End Date <span>*</span></label>
                <input type="date" class="endDate">
            </div>

            <!-- DESIGNATION -->
            <div class="form-group">
                <label>Designation <span>*</span></label>
                <input type="text" class="designation" placeholder="Designation">
            </div>

            ${industryField}

            <!-- LOCATION -->
            <div class="form-group">
                <label>Location <span>*</span></label>
                <input type="text" class="location" placeholder="Location">
            </div>

            <!-- TEAM HANDLING -->
            <div class="form-group">
                <label>Team Handling</label>
                <div class="checkbox-field">
                    <input type="checkbox" class="teamHandlingCheck">
                    <span>Yes</span>
                </div>
            </div>

            <!-- NO. OF PEOPLE -->
            <div class="form-group people-handling-wrap hidden">
                <label>No. of People Handling</label>
                <input
                    type="number"
                    min="1"
                    class="peopleHandling"
                    placeholder="No. of People">
            </div>

        </div>

        <div class="experience-action">
            <button type="button" class="cancel-new-btn">
                CANCEL
            </button>

            <button type="button" class="save-experience-btn">
                SAVE
            </button>
        </div>
    `;

    container.appendChild(card);

    /* ---- Team handling toggle (per card) ---- */

    const teamCheckbox = card.querySelector(".teamHandlingCheck");
    const peopleWrapEl = card.querySelector(".people-handling-wrap");
    const peopleInput = card.querySelector(".peopleHandling");

    teamCheckbox.addEventListener("change", function () {
        if (this.checked) {
            peopleWrapEl.classList.remove("hidden");
        } else {
            peopleWrapEl.classList.add("hidden");
            peopleInput.value = "";
        }
    });

    /* ---- Cancel button ---- */

    card.querySelector(".cancel-new-btn").addEventListener(
        "click",
        function () {
            card.remove();
            showToast("Experience removed.", "success");
        }
    );

    /* ---- Save button ---- */

    card.querySelector(".save-experience-btn").addEventListener(
        "click",
        function () {
            saveExperienceCard(card, type);
        }
    );
}

/* =========================================================
   SAVE EXPERIENCE CARD
========================================================= */

function saveExperienceCard(card, type) {
    const company = card.querySelector(".company");
    const startDate = card.querySelector(".startDate");
    const endDate = card.querySelector(".endDate");
    const designation = card.querySelector(".designation");

    clearCardErrors(card);

    if (!company.value.trim()) {
        markError(company);
        showToast("Please enter Company Name.");
        company.focus();
        return;
    }

    if (!startDate.value) {
        markError(startDate);
        showToast("Please select Start Date.");
        startDate.focus();
        return;
    }

    if (!endDate.value) {
        markError(endDate);
        showToast("Please select End Date.");
        endDate.focus();
        return;
    }

    if (endDate.value < startDate.value) {
        markError(endDate);
        showToast("End Date cannot be before Start Date.");
        endDate.focus();
        return;
    }

    if (!designation.value.trim()) {
        markError(designation);
        showToast("Please enter Designation.");
        designation.focus();
        return;
    }

    /* Team Handling + People (per card) */
    if (type === "relevant" || type === "other") {
        const team = card.querySelector(".teamHandlingCheck");
        const people = card.querySelector(".peopleHandling");

        if (team && team.checked && (!people.value || Number(people.value) < 1)) {
            markError(people);
            showToast("Please enter No. of People Handling.");
            people.focus();
            return;
        }
    }

    /* Lock inputs */
    card.querySelectorAll("input").forEach((input) => {
        input.disabled = true;
    });

    const status = card.querySelector(".record-status");
    if (status) {
        status.textContent = "Saved";
        status.classList.add("saved");
    }

    /* Replace action buttons */
    const action = card.querySelector(".experience-action");

    action.innerHTML = `
        <button type="button" class="remove-experience-btn">
            REMOVE
        </button>

        ${
            type === "relevant"
                ? `
                <button type="button" class="send-other-btn">
                    SEND TO OTHER EXPERIENCE
                </button>
                `
                : ""
        }

        <button type="button" class="add-experience-action-btn">
            ADD ANOTHER EXPERIENCE
        </button>
    `;

    /* REMOVE */
    action.querySelector(".remove-experience-btn").addEventListener(
        "click",
        function () {
            card.remove();
            showToast("Experience removed.", "success");
        }
    );

    /* SEND TO OTHER */
    const sendButton = action.querySelector(".send-other-btn");

    if (sendButton) {
        sendButton.addEventListener("click", function () {
            moveToOtherExperience(card);
        });
    }

    /* ADD ANOTHER */
    action.querySelector(".add-experience-action-btn").addEventListener(
        "click",
        function () {
            addExperience(type);

            const selector =
                type === "relevant"
                    ? "#relevantExperience .experience-card"
                    : "#otherExperience .experience-card";

            const cards = document.querySelectorAll(selector);
            const last = cards[cards.length - 1];

            if (last) {
                last.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        }
    );

    showToast("Experience saved successfully.", "success");
}

/* =========================================================
   MOVE TO OTHER EXPERIENCE
========================================================= */

function moveToOtherExperience(card) {
    const otherContainer = document.getElementById("otherExperience");

    otherCount++;

    const newCard = document.createElement("div");
    newCard.className = "experience-card other-card";

    const teamChecked =
        card.querySelector(".teamHandlingCheck")?.checked || false;

    const peopleValue =
        getCardValue(card, ".peopleHandling") || "";

    newCard.innerHTML = `
        <div class="experience-header">
            <h4>Other Experience ${otherCount}</h4>
            <span class="record-status">New</span>
        </div>

        <div class="exp-grid">

            <div class="form-group">
                <label>Company Name <span>*</span></label>
                <input
                    type="text"
                    class="company"
                    value="${escapeHtml(getCardValue(card, ".company"))}">
            </div>

            <div class="form-group">
                <label>Start Date <span>*</span></label>
                <input
                    type="date"
                    class="startDate"
                    value="${getCardValue(card, ".startDate")}">
            </div>

            <div class="form-group">
                <label>End Date <span>*</span></label>
                <input
                    type="date"
                    class="endDate"
                    value="${getCardValue(card, ".endDate")}">
            </div>

            <div class="form-group">
                <label>Designation <span>*</span></label>
                <input
                    type="text"
                    class="designation"
                    value="${escapeHtml(getCardValue(card, ".designation"))}">
            </div>

            <!-- INDUSTRY (Other Experience only) -->
            <div class="form-group">
                <label>Industry <span>*</span></label>
                <input
                    type="text"
                    class="industry"
                    value="${escapeHtml(getCardValue(card, ".industry"))}">
            </div>

            <div class="form-group">
                <label>Location <span>*</span></label>
                <input
                    type="text"
                    class="location"
                    value="${escapeHtml(getCardValue(card, ".location"))}">
            </div>

            <div class="form-group">
                <label>Team Handling</label>
                <div class="checkbox-field">
                    <input
                        type="checkbox"
                        class="teamHandlingCheck"
                        ${teamChecked ? "checked" : ""}>
                    <span>Yes</span>
                </div>
            </div>

            <div class="form-group people-handling-wrap ${
                teamChecked ? "" : "hidden"
            }">
                <label>No. of People Handling</label>
                <input
                    type="number"
                    min="1"
                    class="peopleHandling"
                    value="${escapeHtml(peopleValue)}"
                    placeholder="No. of People">
            </div>

        </div>

        <div class="experience-action">
            <button type="button" class="cancel-new-btn">
                CANCEL
            </button>

            <button type="button" class="save-experience-btn">
                SAVE
            </button>
        </div>
    `;

    otherContainer.appendChild(newCard);

    const teamCheckbox = newCard.querySelector(".teamHandlingCheck");
    const peopleWrapEl = newCard.querySelector(".people-handling-wrap");
    const peopleInput = newCard.querySelector(".peopleHandling");

    teamCheckbox.addEventListener("change", function () {
        if (this.checked) {
            peopleWrapEl.classList.remove("hidden");
        } else {
            peopleWrapEl.classList.add("hidden");
            peopleInput.value = "";
        }
    });

    newCard.querySelector(".cancel-new-btn").addEventListener(
        "click",
        function () {
            newCard.remove();
            showToast("Experience removed.", "success");
        }
    );

    newCard.querySelector(".save-experience-btn").addEventListener(
        "click",
        function () {
            saveExperienceCard(newCard, "other");
        }
    );

    card.remove();

    newCard.scrollIntoView({ behavior: "smooth", block: "center" });

    showToast("Experience moved to Other Experience.", "success");
}

/* =========================================================
   GET CARD VALUE
========================================================= */

function getCardValue(card, selector) {
    const element = card.querySelector(selector);
    return element ? element.value : "";
}

/* =========================================================
   EDUCATION
========================================================= */

function addEducation() {
    educationCount++;

    const container = document.getElementById("educationArea");

    const card = document.createElement("div");
    card.className = "education-card";

    card.innerHTML = `
        <div class="education-header">
            <h4>Education ${educationCount}</h4>
            <span class="record-status">New</span>
        </div>

        <div class="edu-grid">

            <div class="form-group">
                <label>Institute Name <span>*</span></label>
                <input
                    class="institute"
                    type="text"
                    placeholder="Institute Name">
            </div>

            <div class="form-group">
                <label>Course Name <span>*</span></label>
                <input
                    class="course"
                    type="text"
                    placeholder="Course Name">
            </div>

            <div class="form-group">
                <label>Course Duration <span>*</span></label>
                <select class="duration">
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
            </div>

            <div class="form-group">
                <label>Year of Completion <span>*</span></label>
                <select class="completionYear">
                    ${getYearOptions()}
                </select>
            </div>

        </div>

        <div class="experience-action">
            <button type="button" class="cancel-new-btn">
                CANCEL
            </button>

            <button type="button" class="save-experience-btn">
                SAVE
            </button>
        </div>
    `;

    container.appendChild(card);

    card.querySelector(".cancel-new-btn").addEventListener(
        "click",
        function () {
            card.remove();
            showToast("Education removed.", "success");
        }
    );

    card.querySelector(".save-experience-btn").addEventListener(
        "click",
        function () {
            saveEducationCard(card);
        }
    );
}

/* =========================================================
   SAVE EDUCATION CARD
========================================================= */

function saveEducationCard(card) {
    const institute = card.querySelector(".institute");
    const course = card.querySelector(".course");
    const duration = card.querySelector(".duration");
    const year = card.querySelector(".completionYear");

    clearCardErrors(card);

    if (!institute.value.trim()) {
        markError(institute);
        showToast("Please enter Institute Name.");
        institute.focus();
        return;
    }

    if (!course.value.trim()) {
        markError(course);
        showToast("Please enter Course Name.");
        course.focus();
        return;
    }

    if (!duration.value) {
        markError(duration);
        showToast("Please select Course Duration.");
        duration.focus();
        return;
    }

    if (!year.value) {
        markError(year);
        showToast("Please select Year of Completion.");
        year.focus();
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

    const action = card.querySelector(".experience-action");

    action.innerHTML = `
        <button type="button" class="remove-experience-btn">
            REMOVE
        </button>

        <button type="button" class="add-experience-action-btn">
            ADD ANOTHER EDUCATION
        </button>
    `;

    action.querySelector(".remove-experience-btn").addEventListener(
        "click",
        function () {
            card.remove();
            showToast("Education removed.", "success");
        }
    );

    action.querySelector(".add-experience-action-btn").addEventListener(
        "click",
        function () {
            addEducation();
        }
    );

    showToast("Education saved successfully.", "success");
}

/* =========================================================
   YEAR OPTIONS
========================================================= */

function getYearOptions() {
    const currentYear = new Date().getFullYear();

    let html = `<option value="">Select Year</option>`;

    for (let year = currentYear; year >= 1970; year--) {
        html += `<option value="${year}">${year}</option>`;
    }

    return html;
}

/* =========================================================
   SKILLS
========================================================= */

document.getElementById("saveSkill").addEventListener("click", function () {
    const input = document.getElementById("skillInput");
    const value = input.value.trim();

    if (!value) {
        markError(input);
        showToast("Please enter a skill.");
        input.focus();
        return;
    }

    if (skills.includes(value)) {
        showToast("This skill has already been added.");
        return;
    }

    skills.push(value);
    input.value = "";

    renderSkills();

    showToast("Skill added.", "success");
});

function renderSkills() {
    const container = document.getElementById("skillsList");

    if (!skills.length) {
        container.innerHTML = `<span class="empty">No Skills Added</span>`;
        return;
    }

    container.innerHTML = skills
        .map(
            (skill, index) => `
            <span class="tag">
                ${escapeHtml(skill)}
                <button type="button" onclick="removeSkill(${index})">
                    ×
                </button>
            </span>
        `
        )
        .join("");
}

function removeSkill(index) {
    skills.splice(index, 1);
    renderSkills();
}

/* =========================================================
   TOGGLE SKILLS PANEL
========================================================= */

document.getElementById("addSkillBtn").addEventListener(
    "click",
    function () {

        const panel = document.getElementById("skillsPanel");
        const input = document.getElementById("skillInput");

        panel.classList.remove("hidden");

        this.classList.add("hidden");

        if (input) input.focus();
    }
);


document.getElementById("cancelSkillBtn").addEventListener(
    "click",
    function () {

        const panel = document.getElementById("skillsPanel");
        const toggle = document.getElementById("addSkillBtn");
        const input = document.getElementById("skillInput");

        if (skills.length > 0) {
            showToast(
                "Please remove all skills before closing.",
                "warning"
            );
            return;
        }

        panel.classList.add("hidden");
        toggle.classList.remove("hidden");

        if (input) input.value = "";
    }
);

/* =========================================================
   CERTIFICATES
========================================================= */

document.getElementById("saveCertificate").addEventListener(
    "click",
    function () {
        const input = document.getElementById("certificateInput");
        const value = input.value.trim();

        if (!value) {
            markError(input);
            showToast("Please enter a certificate.");
            input.focus();
            return;
        }

        if (certificates.includes(value)) {
            showToast("This certificate has already been added.");
            return;
        }

        certificates.push(value);
        input.value = "";

        renderCertificates();

        showToast("Certificate added.", "success");
    }
);

function renderCertificates() {
    const container = document.getElementById("certificateList");

    if (!certificates.length) {
        container.innerHTML = `<span class="empty">No Certificates Added</span>`;
        return;
    }

    container.innerHTML = certificates
        .map(
            (certificate, index) => `
            <span class="tag">
                ${escapeHtml(certificate)}
                <button type="button" onclick="removeCertificate(${index})">
                    ×
                </button>
            </span>
        `
        )
        .join("");
}

function removeCertificate(index) {
    certificates.splice(index, 1);
    renderCertificates();
}

/* =========================================================
   TOGGLE CERTIFICATES PANEL
========================================================= */

document.getElementById("addCertificateBtn").addEventListener(
    "click",
    function () {

        const panel = document.getElementById("certificatePanel");
        const input = document.getElementById("certificateInput");

        panel.classList.remove("hidden");

        this.classList.add("hidden");

        if (input) input.focus();
    }
);


document.getElementById("cancelCertificateBtn").addEventListener(
    "click",
    function () {

        const panel = document.getElementById("certificatePanel");
        const toggle = document.getElementById("addCertificateBtn");
        const input = document.getElementById("certificateInput");

        if (certificates.length > 0) {
            showToast(
                "Please remove all certificates before closing.",
                "warning"
            );
            return;
        }

        panel.classList.add("hidden");
        toggle.classList.remove("hidden");

        if (input) input.value = "";
    }
);

/* =========================================================
   FRESHER
========================================================= */

fresher.addEventListener("change", function () {
    if (this.checked) {
        experienceArea.classList.add("hidden");
    } else {
        experienceArea.classList.remove("hidden");
    }

    updateSalaryVisibility();
});

/* =========================================================
   SOURCE
========================================================= */

source.addEventListener("change", function () {
    if (
        this.value === "Employee Reference" ||
        this.value === "Reference"
    ) {
        referenceWrap.classList.remove("hidden");
    } else {
        referenceWrap.classList.add("hidden");
        document.getElementById("referenceName").value = "";
    }
});

/* =========================================================
   SALARY
========================================================= */

function updateSalaryVisibility() {
    if (fresher.checked) {
        lastSalaryWrap.classList.add("hidden");
        expectedSalaryWrap.classList.add("hidden");
    } else {
        lastSalaryWrap.classList.remove("hidden");
        expectedSalaryWrap.classList.remove("hidden");
    }
}

/* =========================================================
   NEXT
========================================================= */

document.getElementById("nextBtn").addEventListener("click", function () {
    if (!validateCurrentStep()) return;

    if (currentStep < totalSteps) {
        currentStep++;
        updateStep();

        window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
        submitApplication();
    }
});

/* =========================================================
   BACK
========================================================= */

document.getElementById("backBtn").addEventListener("click", function () {
    if (currentStep > 1) {
        currentStep--;
        updateStep();

        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

/* =========================================================
   UPDATE STEP
========================================================= */

function updateStep() {
    document.querySelectorAll(".form-step").forEach((step) => {
        step.classList.remove("active");
    });

    const activeStep = document.querySelector(
        `.form-step[data-step="${currentStep}"]`
    );

    if (activeStep) activeStep.classList.add("active");

    document.getElementById("stepTitle").textContent =
        stepTitles[currentStep - 1];

    document.getElementById("stepCount").textContent =
        `Step ${currentStep} of ${totalSteps}`;

    document.getElementById("progressBar").style.width =
        `${(currentStep / totalSteps) * 100}%`;

    document.getElementById("backBtn").style.visibility =
        currentStep === 1 ? "hidden" : "visible";

    document.getElementById("nextBtn").textContent =
        currentStep === totalSteps ? "SUBMIT" : "NEXT";

    updateSalaryVisibility();
}

/* =========================================================
   VALIDATION
========================================================= */

function validateCurrentStep() {
    const step = document.querySelector(
        `.form-step[data-step="${currentStep}"]`
    );

    if (!step) return true;

    clearCardErrors(step);

    /* ---------------- STEP 1 ---------------- */
    if (currentStep === 1) {
        const name = document.getElementById("candidateName");
        const email = document.getElementById("email");
        const contact = document.getElementById("contact");
        const address = document.getElementById("address");
        const dob = document.getElementById("dob");
        const nationality = document.getElementById("nationality");
        const gender = document.getElementById("gender");
        const marital = document.getElementById("maritalStatus");

        const required = [
            [name, "Please enter Candidate Name."],
            [email, "Please enter Email."],
            [contact, "Please enter Contact Number."],
            [address, "Please enter Address."],
            [dob, "Please select Date of Birth."],
            [nationality, "Please select Nationality."],
            [gender, "Please select Gender."],
            [marital, "Please select Marital Status."]
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
            showToast("Please enter a valid 10 digit mobile number.");
            contact.focus();
            return false;
        }
    }

    /* ---------------- STEP 2 ---------------- */
    if (currentStep === 2) {
        if (fresher.checked) return true;

        const cards = document.querySelectorAll(
            "#relevantExperience .experience-card"
        );

        if (!cards.length) {
            showToast("Please add at least one relevant experience.");
            return false;
        }

        let hasSavedRecord = false;

        for (const card of cards) {
            const status = card.querySelector(".record-status");

            if (status && status.classList.contains("saved")) {
                hasSavedRecord = true;
            }
        }

        if (!hasSavedRecord) {
            showToast(
                "Please SAVE your experience record before continuing."
            );
            return false;
        }
    }

    /* ---------------- STEP 3 ---------------- */
    if (currentStep === 3) {
        const educationCards = document.querySelectorAll(
            "#educationArea .education-card"
        );

        if (!educationCards.length) {
            showToast("Please add at least one education record.");
            return false;
        }

        let saved = false;

        educationCards.forEach((card) => {
            const status = card.querySelector(".record-status");

            if (status && status.classList.contains("saved")) {
                saved = true;
            }
        });

        if (!saved) {
            showToast(
                "Please SAVE your education record before continuing."
            );
            return false;
        }
    }

    /* ---------------- STEP 4 ---------------- */
    if (currentStep === 4) {
        const disability = document.getElementById("disability");
        const distance = document.getElementById("distance");
        const availability = document.getElementById("availability");
        const sourceField = document.getElementById("source");

        if (!disability.value) {
            markError(disability);
            showToast("Please select Disability Information.");
            disability.focus();
            return false;
        }

        if (!distance.value) {
            markError(distance);
            showToast("Please enter Distance to Office.");
            distance.focus();
            return false;
        }

        if (!availability.value) {
            markError(availability);
            showToast("Please select Availability to Join.");
            availability.focus();
            return false;
        }

        if (!sourceField.value) {
            markError(sourceField);
            showToast("Please select How Did You Hear About This Job?");
            sourceField.focus();
            return false;
        }

        if (
            sourceField.value === "Employee Reference" ||
            sourceField.value === "Reference"
        ) {
            const reference = document.getElementById("referenceName");

            if (!reference.value.trim()) {
                markError(reference);
                showToast("Please enter Reference Name / Employee ID.");
                reference.focus();
                return false;
            }
        }

        if (!fresher.checked) {
            const expected = document.getElementById("expectedSalary");

            if (!expected.value) {
                markError(expected);
                showToast("Please enter Expected Salary.");
                expected.focus();
                return false;
            }
        }
    }

    return true;
}

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
   SUBMIT
========================================================= */

function submitApplication() {
    if (!validateCurrentStep()) return;

    const data = collectApplicationData();

    console.log("FINAL APPLICATION DATA:", data);

    /*
       Replace this section later with your
       Google Apps Script / API submission.
    */

    showToast("Application submitted successfully.", "success");
}

/* =========================================================
   COLLECT DATA
========================================================= */

function collectApplicationData() {
    return {
        candidate: {
            name: getValue("candidateName"),
            email: getValue("email"),
            contact: getValue("contact"),
            address: getValue("address"),
            dob: getValue("dob"),
            nationality: getValue("nationality"),
            gender: getValue("gender"),
            bloodGroup: getValue("bloodGroup"),
            maritalStatus: getValue("maritalStatus")
        },

        experience: {
            fresher: fresher.checked,
            totalExperience: getValue("totalExperience"),
            relevant: collectExperience(
                "#relevantExperience .experience-card"
            ),
            other: collectExperience(
                "#otherExperience .experience-card"
            )
        },

        education: collectEducation(),

        skills: skills,

        certificates: certificates,

        additional: {
            disability: getValue("disability"),
            military: getValue("military"),
            distance: getValue("distance"),
            availability: getValue("availability"),
            source: getValue("source"),
            referenceName: getValue("referenceName"),
            lastSalary: getValue("lastSalary"),
            expectedSalary: getValue("expectedSalary"),
            negotiable: document.getElementById("negotiable").checked,
            teamHandling: false,
            peopleHandling: ""
        }
    };
}

/* =========================================================
   COLLECT EXPERIENCE
========================================================= */

function collectExperience(selector) {
    return Array.from(document.querySelectorAll(selector)).map((card) => {
        const team = card.querySelector(".teamHandlingCheck");

        return {
            company: getCardValue(card, ".company"),
            startDate: getCardValue(card, ".startDate"),
            endDate: getCardValue(card, ".endDate"),
            designation: getCardValue(card, ".designation"),
            location: getCardValue(card, ".location"),
            industry: getCardValue(card, ".industry"),
            teamHandling: team ? team.checked : false,
            peopleHandling: getCardValue(card, ".peopleHandling")
        };
    });
}

/* =========================================================
   COLLECT EDUCATION
========================================================= */

function collectEducation() {
    return Array.from(
        document.querySelectorAll("#educationArea .education-card")
    ).map((card) => ({
        institute: getCardValue(card, ".institute"),
        course: getCardValue(card, ".course"),
        duration: getCardValue(card, ".duration"),
        completionYear: getCardValue(card, ".completionYear")
    }));
}

/* =========================================================
   GET VALUE
========================================================= */

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
}

/* =========================================================
   AUTO SAVE (DRAFT) — DISABLED
========================================================= */

function saveDraft() {
    /* Draft saving disabled */
    return;
}

/* =========================================================
   RESTORE DRAFT — DISABLED
========================================================= */

function restoreDraft() {
    /* Draft restore disabled — always start fresh */
    localStorage.removeItem("lunawat_candidate_draft");
}

/* =========================================================
   INPUT AUTO SAVE — no-op
========================================================= */

document.addEventListener("input", function () {
    if (!application.classList.contains("hidden")) {
        saveDraft();
    }
});

document.addEventListener("change", function () {
    if (!application.classList.contains("hidden")) {
        saveDraft();
    }
});

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   BEFORE UNLOAD — clear any leftover draft
========================================================= */

window.addEventListener("beforeunload", function () {
    localStorage.removeItem("lunawat_candidate_draft");
});

/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    initializeForms();
    updateSalaryVisibility();
    localStorage.removeItem("lunawat_candidate_draft");
});