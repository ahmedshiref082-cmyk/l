
const AdventureApp = {
    storageKey: "arabicAdventureProgress",

    levels: [
        { name: "مستكشف الحروف", min: 0, emoji: "🌱" },
        { name: "متعلم نشيط", min: 50, emoji: "⭐" },
        { name: "بطل اللغة العربية", min: 150, emoji: "🏆" },
        { name: "أسطورة الحروف", min: 300, emoji: "👑" }
    ],

    // إعدادات الصوت
    audioSettings: {
        rate: 0.8,
        pitch: 1,
        volume: 1
    },

    // الحصول على التقدم
    getProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            const progress = saved ? JSON.parse(saved) : {};

            return {
                points: Number(progress.points) || 0,
                completedLessons: Array.isArray(progress.completedLessons)
                    ? progress.completedLessons : [],
                badges: Array.isArray(progress.badges)
                    ? progress.badges : []
            };
        } catch (error) {
            console.error("خطأ في قراءة التقدم:", error);

            return {
                points: 0,
                completedLessons: [],
                badges: []
            };
        }
    },

    // حفظ التقدم
    saveProgress(progress) {
        localStorage.setItem(
            this.storageKey,
            JSON.stringify(progress)
        );
    },

    // تحديد المستوى
    getLevel(points) {
        let currentLevel = this.levels[0];

        for (const level of this.levels) {
            if (points >= level.min) {
                currentLevel = level;
            }
        }

        return currentLevel;
    },

    // المستوى التالي
    getNextLevel(points) {
        return this.levels.find(level => points < level.min) || null;
    },

    // عرض النقاط والمستوى
    renderPoints() {
        const progress = this.getProgress();

        document.querySelectorAll(".points-count").forEach(element => {
            element.textContent = progress.points;
        });

        document.querySelectorAll(".level-name").forEach(element => {
            element.textContent = this.getLevel(progress.points).name;
        });
    },

    // إضافة النقاط
    updatePoints(amount) {
        const progress = this.getProgress();

        progress.points += amount;

        this.saveProgress(progress);
        this.checkBadges(progress);
        this.renderPoints();

        return progress.points;
    },

    // فتح شارة
    unlockBadge(name) {
        const progress = this.getProgress();

        if (!progress.badges.includes(name)) {
            progress.badges.push(name);
            this.saveProgress(progress);
        }
    },

    // فحص الشارات
    checkBadges(progress) {
        const lessons = progress.completedLessons.length;

        if (lessons >= 1) {
            this.unlockBadge("البداية الرائعة");
        }

        if (lessons >= 5) {
            this.unlockBadge("بطل التعلم");
        }

        if (lessons >= 10) {
            this.unlockBadge("خبير الحروف");
        }

        if (progress.points >= 100) {
            this.unlockBadge("جامع النقاط");
        }
    },

    // إكمال الدرس
    completeLesson(lessonName) {
        const progress = this.getProgress();

        if (!progress.completedLessons.includes(lessonName)) {
            progress.completedLessons.push(lessonName);
            progress.points += 10;

            this.saveProgress(progress);
            this.checkBadges(progress);
        }

        this.renderPoints();
    },

    // إضافة شارة
    addBadge(badgeName) {
        this.unlockBadge(badgeName);
    },

    // اختيار الصوت العربي
    getArabicVoice() {
        if (!("speechSynthesis" in window)) return null;

        const voices = window.speechSynthesis.getVoices();

        return (
            voices.find(voice => voice.lang.toLowerCase() === "ar-eg") ||
            voices.find(voice => voice.lang.toLowerCase().startsWith("ar")) ||
            null
        );
    },

    // إيقاف جميع الأصوات
    stopAudio() {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    },

    // نطق النصوص العربية
    speak(text, options = {}) {
        if (!("speechSynthesis" in window)) {
            console.warn("المتصفح لا يدعم النطق الصوتي.");
            return;
        }

        this.stopAudio();

        const utterance = new SpeechSynthesisUtterance(String(text));
        const voice = this.getArabicVoice();

        if (voice) {
            utterance.voice = voice;
        }

        utterance.lang = voice?.lang || "ar-EG";
        utterance.rate = options.rate ?? this.audioSettings.rate;
        utterance.pitch = options.pitch ?? this.audioSettings.pitch;
        utterance.volume = options.volume ?? this.audioSettings.volume;

        window.speechSynthesis.speak(utterance);
    },

    // مؤثرات صوتية باستخدام Web Audio
    playEffect(type = "click") {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        try {
            const context = new AudioContextClass();

            const effects = {
                correct: [523.25, 659.25, 783.99],
                wrong: [440, 330],
                click: [600],
                next: [600],
                finish: [523.25, 659.25, 783.99, 1046.5],
                achievement: [659.25, 783.99, 1046.5]
            };

            const frequencies = effects[type] || effects.click;

            frequencies.forEach((frequency, index) => {
                const oscillator = context.createOscillator();
                const gain = context.createGain();

                oscillator.type = "sine";
                oscillator.frequency.value = frequency;

                gain.gain.setValueAtTime(0.0001, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(
                    0.5,
                    context.currentTime + 0.02
                );
                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    context.currentTime + 0.25
                );

                oscillator.connect(gain);
                gain.connect(context.destination);

                const startTime = context.currentTime + index * 0.12;

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.27);
            });

            setTimeout(() => context.close(), 1500);

        } catch (error) {
            console.error("تعذر تشغيل المؤثر الصوتي:", error);
        }
    },

    // تهيئة الموقع
    initialize() {
        const progress = this.getProgress();

        this.checkBadges(progress);
        this.renderPoints();

        // تحميل الأصوات المتاحة
        if ("speechSynthesis" in window) {
            window.speechSynthesis.getVoices();

            window.speechSynthesis.onvoiceschanged = () => {
                this.getArabicVoice();
            };
        }
    }
};

window.AdventureApp = AdventureApp;

// تشغيل الموقع
document.addEventListener("DOMContentLoaded", () => {
    AdventureApp.initialize();
});
