

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

let product_interpretations = [];




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
    product_interpretations = response['product_interpretations']

    // Remove unnecessaryinfo from products
    const products = response['products'].map(product => {
        return {
            name: product.name,
            price: product.price,
            sku: product.sku,
            custom_attributes: product.custom_attributes.filter(attribute => ['image', 'url_key'].includes(attribute.attribute_code)),
            description: product.description
        }
    });

    const assistant_message = { content: response['response'], role: 'assistant', products, debug: response['debug'], basic_debug: response['basic_debug'] };
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

        if (selected_products.length == 0){ // Select all wheels if no wheels are selected
            for (let i = chatMessages.length - 1; i >= 0; i--){
                if (chatMessages[i].role === 'assistant'){
                    if (chatMessages[i].products.length > 0){
                        selected_products = chatMessages[i].products;
                        break;
                    }
                }
            }
        }

        const response = await fetch(
            'https://lqvmj75x7zzg7d7ur5sindfkdi0yjqxg.lambda-url.us-east-1.on.aws/ ',
            {
                method: 'POST',
                body: JSON.stringify({ url, product_interpretations, chat_history, selected_products }),
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

                const image = displayed_product['custom_attributes'].find(attribute => attribute.attribute_code === 'image')?.['value'];
                const url_key = displayed_product['custom_attributes'].find(attribute => attribute.attribute_code === 'url_key')?.['value'];

                carouselItem.innerHTML = `
                    <div>
                        <a href="https://mcstaging.tdotperformance.ca/${url_key}.html" target="_blank">
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
                textElement.style.paddingTop = '5px';
                textElement.style.marginTop = '0px';
                textElement.style.marginBottom = '5px';
                textElement.style.fontSize = '11px';
                
                const showDebug = document.createElement('button');
                showDebug.textContent = 'Show Debug';
                showDebug.style.padding = '5px';

                const showAdvancedDebug = document.createElement('button');
                showAdvancedDebug.textContent = 'Show Advanced Debug';
                showAdvancedDebug.style.padding = '5px';

                showDebug.addEventListener('click', () => {
                    if (showDebug.textContent === 'Show Debug'){
                        showDebug.textContent = 'Hide Debug';
                        textElement.textContent = JSON.stringify(message.basic_debug, null, 4);
                        showAdvancedDebug.textContent = 'Show Advanced Debug';
                    } else { 
                        showDebug.textContent = 'Show Debug';
                        textElement.textContent = '';
                    }
                });

                showAdvancedDebug.addEventListener('click', () => {
                    if (showAdvancedDebug.textContent === 'Show Advanced Debug'){
                        showAdvancedDebug.textContent = 'Hide Advanced Debug';
                        textElement.textContent = JSON.stringify(message.debug, null, 4);
                        showDebug.textContent = 'Show Debug';
                    } else {
                        showAdvancedDebug.textContent = 'Show Advanced Debug';
                        textElement.textContent = '';
                    }
                });

                const copyRequestButton = document.createElement('button');
                copyRequestButton.textContent = 'Copy Request';
                copyRequestButton.style.padding = '5px';

                copyRequestButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(JSON.stringify(message.debug, null, 4));
                    copyRequestButton.textContent = 'Copied!';
                    copyRequestButton.backgroundColor = 'green';

                    setTimeout(() => {
                        copyRequestButton.textContent = 'Copy Request';
                        copyRequestButton.backgroundColor = 'buttonface';
                    }
                    , 2000);
                });

                const sendEmailButton = document.createElement('button');
                sendEmailButton.textContent = 'Submit Issue';
                sendEmailButton.style.padding = '5px';

                sendEmailButton.addEventListener('click', async () => {
                    const issue = prompt('Describe the issue:');

                    sendEmailButton.textContent = 'Sending...';
                    sendEmailButton.backgroundColor = 'yellow';
                    sendEmailButton.disabled = true;
                    let response = { status: 200 };
                    try{
                        response = await fetch(
                            'https://a45mvwsk2g5e4jnwwb2j2sooyu0mhaie.lambda-url.us-east-1.on.aws/ ',
                            {
                                method: 'POST',
                                body: JSON.stringify({ issue, debug: message.debug }),
                            }
                        );
                    } catch (error) {
                        
                    }
                  

                    if (response.status === 200){
                        sendEmailButton.textContent = 'Sent!';
                        sendEmailButton.backgroundColor = 'green';
                    } else {
                        sendEmailButton.textContent = 'Error!';
                        sendEmailButton.backgroundColor = 'red';
                    }
            

                    setTimeout(() => {
                        sendEmailButton.textContent = 'Submit Another Issue';
                        sendEmailButton.backgroundColor = 'buttonface';
                        sendEmailButton.disabled = false;
                    }, 4000);
                });

                debugElement.appendChild(showDebug);
                debugElement.appendChild(showAdvancedDebug);
                debugElement.appendChild(copyRequestButton);
                debugElement.appendChild(sendEmailButton);

                debugElement.appendChild(textElement);

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
    product_interpretations = [];
});

updateChatUI();