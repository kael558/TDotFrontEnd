

let chatMessages = [];

let category = "wheels";
let vehicle_id = "";

let product_interpretations = [];

let email_url = "";
let chat_url = "";

let abortController = new AbortController();

// Generate a random session id
let session_id = 'test';
function generateSessionId() {
    session_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    document.getElementById('session-id').textContent = session_id;
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

    if (response === null) {
        updateChatUI(loading=false);
        return;
    }

    // merge product with product from response
    product_interpretations = response['product_interpretations']

    vehicle_id = response['vehicle_id'] || vehicle_id;

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
        
        let all_products = [];
        let names = new Set();
        for (let i = 0; i< chatMessages.length; i++){
            if (chatMessages[i].role === 'assistant'){
                for (let j = 0; j < chatMessages[i].products.length; j++){
                    if (!names.has(chatMessages[i].products[j].name)){
                        all_products.push(chatMessages[i].products[j]);
                    }
                    names.add(chatMessages[i].products[j].name);
                }
            }
        }

   
        const response = await fetch(
            chat_url,
            {
                method: 'POST',
                body: JSON.stringify({ url, product_interpretations, chat_history, selected_products, vehicle_id, all_products, session_id }),
                signal: abortController.signal,
            },   
        );


        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            return null;
        }
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
                            <img src="https://www.tdotperformance.ca/media/catalog/product${image}" alt="Image Unavailable" width="100">
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
                    navigator.clipboard.writeText(JSON.stringify(message.debug.request_body, null, 4));
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
                            email_url,
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
        // disable text input
        document.getElementById('message-input').disabled = true;

        const loadingElement = document.createElement('div');
        loadingElement.innerHTML = '<p><strong>Assistant:</strong> Loading...</p>';
        chatWindow.appendChild(loadingElement);

        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop';
        stopButton.style.padding = '5px';
        stopButton.style.marginTop = '0px';
        stopButton.style.marginBottom = '5px';
        stopButton.style.fontSize = '15px';
        
        stopButton.addEventListener('click', () => {
            abortController.abort();
            abortController = new AbortController();
            updateChatUI();
        });

        chatWindow.appendChild(stopButton);
    } else {
        // enable text input
        document.getElementById('message-input').disabled = false;
    }

    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

document.getElementById('message-input').addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById('message-form').dispatchEvent(new Event('submit'));
    }
});

document.getElementById('message-form').addEventListener('submit', sendMessage);
document.getElementById('url-input').addEventListener('change', () => {
    vehicle_id = "";
});

document.getElementById('reset-button').addEventListener('click', () => {
    chatMessages = [];
    updateChatUI();
    generateSessionId();
    vehicle_id = "";
    product_interpretations = [];
});

document.getElementById('signInForm').addEventListener('submit', async function(event){
    event.preventDefault();

    const passcode = document.getElementById('passcode').value;

    console.log(passcode);
    console.log(JSON.stringify({ passcode }));

    const response = await fetch(
        'https://qk636fcww4j53k4vrozlxevywa0trzea.lambda-url.us-east-1.on.aws/',
        {
            method: 'POST',
            body: JSON.stringify({ passcode }),
        }
    );

    const data = await response.json();

    if (data['status'] === 'success'){
        document.getElementById('signInForm').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        // set urls
        email_url = data['email_url'];
        chat_url = data['chat_url'];
    } else {
        alert('Wrong passcode');
    }
});

updateChatUI(false);
generateSessionId();