

//Define an array to store chat messages 
/*let chatMessages = [
    {
        "role": "assistant",
        "content": "Hi, I'm the Tdot Performance Assistant. How can I help you today?",
        "products": [
            {
                "name": "Product 1",
                "price": "$10",
                "custom_attributes": [
                    {
                        "attribute_code": "image",
                        "value": "/w/h/whl_1.jpg"
                    },
                    {
                        "attribute_code": "url_key",
                        "value": "product-1"
                    }
                ]
            },
            {
                "name": "Product 2",
                "price": "$20",
                "custom_attributes": [
                    {
                        "attribute_code": "image",
                        "value": "/w/h/whl_2.jpg"
                    },
                    {
                        "attribute_code": "url_key",
                        "value": "product-2"
                    }
                ]
            }
        ],
        "debug": {
            "product": {
                "name": "Product 1",
                "imageUrl": "https://via.placeholder.com/150",
                "price": "$10"
            },
            "time_taken": 0.123,
            "tokens": 1293
        }
    }
];*/

let chatMessages = [];

let category = "wheels";
let vehicle_id = "";

let product = {

}




// Define a function to send a message function 
async function sendMessage(event) { 
    event.preventDefault();

    var content = document.getElementById('message-input').value;
    document.getElementById('message-input').value = '';

    const user_message = { content: content, role: 'user' };
    chatMessages.push(user_message);

    updateChatUI(loading=true);

    // Call the API to create the message
    const response = await getResponse();

    // merge product with product from response
    product = {...product, ...response['product']};

    const debug = response['debug'];
    /* debug['selected_products'] = debug['selected_products'].map(product => {
        return {
            "name": product['name'],
            "price": product['price'],
            "sku": product['sku'],
            "description": product['description'],
        }
    });*/


    const assistant_message = { content: response['response'], role: 'assistant', products: response['products'], debug };
    chatMessages.push(assistant_message);

    // Populate the chat window with the messages
    updateChatUI(loading=false);
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

    try {
        url = document.getElementById('url-input').value || "https://mcstaging.tdotperformance.ca/all-all-all-parts/wheels-tires/wheels?rims_vehicle_id=22698"
        chat_history = chatMessages.map(message => { return { content: message.content, role: message.role }});
        let selected_products = [];
        for (let i = chatMessages.length - 1; i >= 0; i--){
            if (chatMessages[i].role === 'assistant'){
                selected_products = chatMessages[i].products.filter(product => product.isSelected);
                if (selected_products.length > 0){
                    break;
                }
            }
        }

        const response = await fetch(
            'https://lqvmj75x7zzg7d7ur5sindfkdi0yjqxg.lambda-url.us-east-1.on.aws/ ',
            {
                method: 'POST',
                body: JSON.stringify({ url, product, chat_history, selected_products }),
            }
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
        return {
            "response": "Got this error from server: " + error,
            "products": []
        }
    }
}


function updateChatUI(loading=false) { 
    const chatWindow = document.getElementById('chat-window');

    chatWindow.innerHTML = '';

    chatMessages.forEach(message => { 
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        // Set the message content
        if (message.role === 'user') {
            messageElement.innerHTML = `<p><strong>You:</strong> ${message.content}</p>`;
        } else if (message.role === 'assistant') {
            messageElement.innerHTML = `<p><strong>Assistant:</strong> ${message.content}</strong></p>`;
            
            const carouselContainer = document.createElement('div');
            carouselContainer.classList.add('carousel');

            message.products.forEach(displayed_product => {
                const carouselItem = document.createElement('div');
                carouselItem.classList.add('carousel-item');
                carouselItem.style.position = 'relative';
        
                if ('isSelected' in displayed_product && displayed_product.isSelected) {
                    carouselItem.classList.add('selected'); // Add class if selected
                }

                const image = displayed_product['custom_attributes'].find(attribute => attribute.attribute_code === 'image')['value'];
                const url_key = displayed_product['custom_attributes'].find(attribute => attribute.attribute_code === 'url_key')['value'];

                carouselItem.innerHTML = `
                    <div>
                        <a href="https://www.tdotperformance.ca/${url_key}.html" target="_blank">
                            <img src="https://www.tdotperformance.ca/media/catalog/product${image}" alt="${displayed_product.name}" width="100">
                            <p>${displayed_product.name}</p>
                        </a>
                        <p>$${displayed_product.price}</p>
                        <div style="position: absolute; top: 0; right: 0; width: 50px; height: 25px;">
                            <button style="width: 100%; height: 100%;">Select</button>
                        </div>
                    </div>
                `;
        
                const selectButton = carouselItem.querySelector('button');
                selectButton.addEventListener('click', () => {
                    if (!('isSelected' in displayed_product)) {
                        displayed_product.isSelected = false;
                    }

                    displayed_product.isSelected = !displayed_product.isSelected; // Toggle isSelected property
                    carouselItem.classList.toggle('selected', displayed_product.isSelected); // Toggle class based on isSelected
                });
        
                carouselContainer.appendChild(carouselItem);
                
            });

            messageElement.appendChild(carouselContainer);


            if (message.debug){
                const debugElement = document.createElement('div');
                debugElement.classList.add('debug-container');

                const textElement = document.createElement('p');
                textElement.textContent = JSON.stringify(message.debug, null, 4);
                textElement.style.display = 'none';
                textElement.style.paddingTop = '0px';
                textElement.style.marginTop = '0px';
                textElement.style.marginBottom = '5px';
                textElement.style.fontSize = '11px';
                
                const toggleButton = document.createElement('button');
                toggleButton.textContent = 'Show Debug';
                toggleButton.style.padding = '5px';

                toggleButton.addEventListener('click', () => {
                    textElement.classList.toggle('show');
                    toggleButton.textContent = toggleButton.textContent === 'Show Debug' ? 'Hide Debug' : 'Show Debug';
                });
                
                debugElement.appendChild(textElement);
                debugElement.appendChild(toggleButton);

                messageElement.appendChild(debugElement);
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
document.getElementById('url-input').addEventListener('change', () => {
    vehicle_id = "";
});

document.getElementById('reset-button').addEventListener('click', () => {
    chatMessages = [];
    updateChatUI();
    vehicle_id = "";
});

updateChatUI();