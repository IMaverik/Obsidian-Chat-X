frappe.after_ajax(function () {
    try {
        createChat();
        // Force DOM update
        frappe.dom.freeze();
        frappe.dom.unfreeze();
    } catch (error) {
        console.error("Chatbot initialization error:", error);
    }
});

function createChat() {
    let chatFooter = `<footer>
            <button class="chatbot-toggler">
                <span class="material-symbols-rounded">forum</span>
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="chatbot">
                <div class="chat-header">
                    <div class="logo-container">
                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Wireframe%20%282%29-RT1L0RmVNSun8fWJs822L6gxyU65tT.png" 
                             alt="Chatbot Logo" 
                             style="width: 40px; height: 40px; margin-right: 10px;">
                        <h2>Exacuer AI</h2>
                    </div>
                    <span class="expand-btn material-symbols-outlined">open_in_full</span>
                    <span class="close-btn material-symbols-outlined">close</span>
                </div>
                <ul class="chatbox">
                    <li class="chat incoming">
                        <span class="material-symbols-outlined">smart_toy</span>
                        <p id="user-greeting">Hi there 👋<br>How I assist you today?</p>
                    </li>
                </ul>
                <div class="chat-input">
                    <textarea placeholder="Enter a message..." spellcheck="false" required></textarea>
                    <span id="send-btn" class="material-symbols-rounded">send</span>
                </div>
            </div>
        </footer>`;

    // Replace footer with error handling
    try {
        const $footer = $("footer");
        if ($footer.length) {
            $footer.replaceWith(frappe.render_template(chatFooter));
        } else {
            console.warn("Footer element not found, appending instead");
            $("body").append(frappe.render_template(chatFooter));
        }
    } catch (error) {
        console.error("Footer replacement failed:", error);
    }

    const chatbotToggler = document.querySelector(".chatbot-toggler");
    const expandBtn = document.querySelector(".expand-btn");
    const closeBtn = document.querySelector(".close-btn");
    const chatbox = document.querySelector(".chatbox");
    const chatbot = document.querySelector(".chatbot");
    const chatInput = document.querySelector(".chat-input textarea");
    const sendChatBtn = document.querySelector(".chat-input span");
    let chatHistory = [];

    let userMessage = null;
    const inputInitHeight = chatInput.scrollHeight;

    const createChatLi = (message, className) => {
        const chatLi = document.createElement("li");
        chatLi.classList.add("chat", `${className}`);
        let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
        chatLi.innerHTML = chatContent;
        chatLi.querySelector("p").innerHTML = message;
        chatLi.querySelector("p").classList.add("dots-loader");
        return chatLi;
    }

    function formatCodeBlocks(input) {
        const regex = /```(\w+)?\n([\s\S]*?)```/g;
        const formattedText = input.replace(regex, (match, language, code) => {
            const lang = language || "text";
            return `<pre class="code-block" data-language="${lang}"><code class="language-${lang}">${code.trim()}</code></pre>`;
        });
        return formattedText;
    }

    const handleChat = () => {
        chatInput.disabled = true;
        userMessage = chatInput.value.trim();
        if (!userMessage) return;

        chatInput.value = "";
        chatInput.style.height = `${inputInitHeight}px`;

        chatbox.appendChild(createChatLi(userMessage, "outgoing"));
        chatbox.scrollTo(0, chatbox.scrollHeight);

        const incomingChatLi = createChatLi("<i></i><i></i><i></i> ", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        let message = {
            role: "user",
            content: userMessage
        }
        chatHistory.push(message)
        frappe.call({
            method: "innomateai.controllers.ai_controllers.chat_reponse",
            args: {
                question: userMessage,
                chat: chatHistory
            },
            callback: function (r) {
                console.log(r)
                let res = r.message;
                let answer = res.assistant
                const messageElement = incomingChatLi.querySelector("p");
                messageElement.classList.remove("dots-loader")
                messageElement.innerHTML = formatCodeBlocks(answer);

                chatbox.scrollTo(0, chatbox.scrollHeight);
                chatHistory.push({role: "Assistant", content: answer})
                chatInput.disabled = false;
            },
            error: function(error) {
                console.error("Chat response error:", error);
                const messageElement = incomingChatLi.querySelector("p");
                messageElement.classList.remove("dots-loader");
                messageElement.innerHTML = "Error occurred while processing your request.";
                chatInput.disabled = false;
            }
        })
    }

    chatInput.addEventListener("input", () => {
        chatInput.style.height = `${inputInitHeight}px`;
        chatInput.style.height = `${chatInput.scrollHeight}px`;
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
            e.preventDefault();
            handleChat();
        }
    });

    sendChatBtn.addEventListener("click", handleChat);
    expandBtn.addEventListener("click", () => {
        if (expandBtn.textContent.trim() === 'open_in_full') {
            expandBtn.textContent = 'close_fullscreen';
            chatbot.classList.toggle("expand_chat");
        } else {
            expandBtn.textContent = 'open_in_full';
            chatbot.classList.toggle("expand_chat");
        }
    });
    closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"))
    chatbotToggler.addEventListener("click", () => {
        document.body.classList.toggle("show-chatbot");
        document.getElementById("user-greeting").innerHTML = `Hi ${frappe.session.user_fullname} 👋<br>How can I help you today?`;
    });
}