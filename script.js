document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");
  const placeholderText = document.getElementById("placeholderText");
  const timerText = document.getElementById("timerText");

  // ইমেজ আপলোড প্রিভিউ
  imageInput.addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("অনুগ্রহ করে একটি ইমেজ ফাইল বেছে নিন।");
      imageInput.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    previewImage.src = url;
    previewImage.style.display = "block";
    placeholderText.style.display = "none";
  });
  
  // Timer – প্রতি সেকেন্ডে সময় দেখাবে (চাইলে এই অংশ বাদ দিতে পারো)
  function getBanglaDateTime() {
    const engToBn = {
        "0":"০","1":"১","2":"২","3":"৩","4":"৪",
        "5":"৫","6":"৬","7":"৭","8":"৮","9":"৯"
    };

    const months = [
        "জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন",
        "জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"
    ];

    const now = new Date();

    let day = now.getDate().toString();
    let month = months[now.getMonth()];
    let year = now.getFullYear().toString();

    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    let ampm = hour >= 12 ? "PM" : "AM";

    // convert to 12h format
    hour = hour % 12 || 12;

    // Convert to string
    hour = hour.toString().padStart(2,"0");
    minute = minute.toString().padStart(2,"0");
    second = second.toString().padStart(2,"0");

    // Convert all digits → Bangla
    function toBn(num){ return num.replace(/[0-9]/g, d => engToBn[d]); }

    day = toBn(day);
    year = toBn(year);
    hour = toBn(hour);
    minute = toBn(minute);
    second = toBn(second);
    ampm = ampm === "AM" ? "AM" : "PM";

    return `${day} ${month} ${year} | ${hour}:${minute}:${second} ${ampm}`;
}

// Live update every second
setInterval(() => {
  document.getElementById("timerText").textContent = getBanglaDateTime();
}, 1000);

});
