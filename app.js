const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestion = document.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton = document.querySelector("#toggle-theme-button")
const deleteChatButton = document.querySelector("#delete-chat-button")


let userMessage = null;
let isResonseGenerating = false;

//API configuration
const API_KEY = "AIzaSyA1NdB90AQpc59Niyt-q933fsdw5U8YyDY";
const API_URL = ` https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const localLocalStorageData = () => {
   const savedChats = localStorage.getItem("savedChats")
   const isLightMode = (localStorage.getItem("themeColor") === "light_made")
   document.body.classList.toggle("light_mode", isLightMode);
   toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

   chatList.innerHTML = savedChats || "";

   document.body.classList.toggle("hide-header", savedChats)

   chatList.scrollTo(0, chatList.scrollHeight); //scroll to the button

}
localLocalStorageData();

//create a new message element and return it 
const createMessageElement = (content, ...classes) => {
   const div = document.createElement("div");
   div.classList.add("message", ...classes);
   div.innerHTML = content;
   return div;
}

// show typing effert  by disaplay word pne by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
   const words = text.split(' ');
   let currenWordIndex = 0

   const typingInterval = setInterval(() => {
      //append each woprd to the text element with space
      textElement.innerText += (currenWordIndex === 0 ? '' : ' ') + words[currenWordIndex++]
      incomingMessageDiv.querySelector(".icon").classList.add("hide")
      if (currenWordIndex === words.length) {
         clearInterval(typingInterval)
         isResonseGenerating = false;
         incomingMessageDiv.querySelector(".icon").classList.remove("hide")

         localStorage.setItem("savedChats", chatList.innerHTML)
         
      }
      chatList.scrollTo(0, chatList.scrollHeight); //scroll to the button
   }, 75);
}

//Fetch response from the API base on user message 
const generateAPIResponse = async (incomingMessageDiv) => {
   const textElement = incomingMessageDiv.querySelector(".text"); //get text element
   //Send a POST request to the API with the user's message
   try {
      const response = await fetch(API_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            contents: [{
               role: "user",
               parts: [{ text: userMessage }]
            }]
         })
      });

      const data = await response.json();
      if(!response.ok) throw new Error(data.error.message);

      //get the API Response text
      const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
      showTypingEffect(apiResponse, textElement, incomingMessageDiv);
   } catch (error) {
      isResonseGenerating = false;
      textElement.innerText = error.message;
      textElement.classList.add("error")
   } finally {
      incomingMessageDiv.classList.remove("loading")
   }

}
//show a loading animation while waiting for API  Response
const showLoadingAnimation = () => {
   const html = `  <div class="message-content">
                <img src="images/gemini.svg" alt="Gimini image" class="avatar">
                 <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
   const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
   chatList.appendChild(incomingMessageDiv);

   chatList.scrollTo(0, chatList.scrollHeight); //scroll to the button
   generateAPIResponse(incomingMessageDiv);

}
//copy message text to the clipboard
const copyMessage = (copyIcon) => {
   const messageText = copyIcon.parentElement.querySelector(".text").innerText;
   navigator.clipboard.writeText(messageText);
   copyIcon.innerText = "done" //show click icon
   setTimeout(() => copyIcon.innerText = "content_copy", 1000) // revert icon after 1 second
}

//Handle sending outgoing chat messages
const handleOutgoingChat = () => {
   userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
   if (!userMessage || isResonseGenerating) return // Exit if there is no message
   isResonseGenerating = true;

   const html = ` <div class="message-content">
                <img src="images/user.jpg" alt="User image" class="avatar">
                <p class="text"> </div>`;
   const outgoingMessageDiv = createMessageElement(html, "outgoing");
   outgoingMessageDiv.querySelector(".text").innerText = userMessage;
   chatList.appendChild(outgoingMessageDiv)

   typingForm.reset(); //clear input field 
   chatList.scrollTo(0, chatList.scrollHeight); //scroll to the button

   document.body.classList.add("hide-header")
   setTimeout(showLoadingAnimation, 500) //show loading animation after a delay 

}
// set usermessage and handle outgoing chat when a suggestion is clicked
suggestion.forEach(suggestion => {
   suggestion.addEventListener("click", () => {
      userMessage = suggestion.querySelector(".text").innerText;
      handleOutgoingChat();
   });
});
//Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
   const isLightMode = document.body.classList.toggle("light_mode");
   localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode")
   toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});
 //deleted the all chats from local button is clicked
deleteChatButton.addEventListener("click", () => {
   if(confirm("Are you sure want to deleted all messages")){
      localStorage.removeItem("savedChats")
      localLocalStorageData();
   }
})
//prevent default from submission and handle outgoing chat

typingForm.addEventListener("submit", (e) => {
   e.preventDefault();
   handleOutgoingChat();
})