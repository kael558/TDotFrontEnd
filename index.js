//Define an array to store chat messages 
let chatMessages = [];

// Define a function to send a message function 
async function sendMessage(event) { 
    event.preventDefault();

    var content = document.getElementById('message-input').value;
    document.getElementById('message-input').value = '';

    const user_message = { content: content, role: 'user' };
    chatMessages.push(user_message);

    populateChatWindow(loading=true);

    // Call the API to create the message
    const response = await getResponse();

    const assistant_message = { content: response, role: 'assistant' };
    chatMessages.push(assistant_message);

    // Populate the chat window with the messages
    populateChatWindow(loading=false);
}


async function getResponse(){
    /*return {
        "response": "Awesome to hear!",
        "products": [
            {
                "name": "Product 1",
                "imageUrl": "https://via.placeholder.com/150",
                "price": "$10"
            },
            {
                "name": "Product 2",
                "imageUrl": "https://via.placeholder.com/150",
                "price": "$20"
            },
            {
                "name": "Product 3",
                "imageUrl": "https://via.placeholder.com/150",
                "price": "$30"
            }
        ]
    }*/

    const url = document.getElementById('url-input').value;


    const response = await fetch(
        'https://ujhv7yvczfyi5wkdbrihkjcamq0orcfh.lambda-url.us-east-1.on.aws/',
        {
            method: 'POST',
            body: JSON.stringify({ url: url, chat_history: chatMessages }),
        }
    );
    const data = await response.json();
    return data;
}


function populateChatWindow(loading=false) { 
    const chatWindow = document.getElementById('chat-window');

    chatWindow.innerHTML = '';

    chatMessages.forEach(message => { 
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        // Set the message content
        if (message.role === 'user') {
            messageElement.innerHTML = `<p><strong>You:</strong> ${message.content}</p>`;
        } else if (message.role === 'assistant') {
            messageElement.innerHTML = `<p><strong>Assistant:</strong> ${message.content.response}</strong></p>`;

            if (message.content.products && message.content.products.length > 0) {
                // Create a carousel container
                const carouselContainer = document.createElement('div');
                carouselContainer.classList.add('carousel');
    
                // Loop over the products and create carousel items
                message.content.products.forEach(product => {
                    carouselContainer.innerHTML += `
                    <a href="${product.url}" target="_blank">
                        <div class="carousel-item">
                            <img src="${product.image}" alt="${product.name}" width="100">
                            <p>${product.name}</p>
                            <p>${product.price}</p>
                        </div>
                    </a>
                    `;
                });
    
                // Add the carousel container to the message element
                messageElement.appendChild(carouselContainer);
            } 
        }
        
        // Add the message element to the chat window
        chatWindow.appendChild(messageElement);
    });

    if (loading) {
        const loadingElement = document.createElement('div');
        loadingElement.innerHTML = '<p><strong>Assistant:</strong> Loading...</p>';
        chatWindow.appendChild(loadingElement);
    }

    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


document.getElementById('message-form').addEventListener('submit', sendMessage);
