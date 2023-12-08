/*
1. Scrape all products
2. Integrate tire data
3. Finish html page

1. Scrape all products
2. Integrate tire data
3. Implement proper fitment data

- selected products
- options to sort products according to price/ stock
- clear chat
*/



//Define an array to store chat messages 
let chatMessages = [];

let category = "wheels";

let product = {

}

let product_options = {
    'wheels': [
        {'key': 'name', 'type': 'string'}, 
        {'key': 'brand', 'type': 'string'},
        {'key': 'series', 'type': 'string'},
        {'key': 'wheel_width', 'type': 'float'},
        {'key': 'wheel_diameter', 'type': 'float'},
        {'key': 'bolt_pattern', 'type': 'string'},
        {'key': 'center_bore', 'type': 'float'},
        {'key': 'offset', 'type': 'integer'},
        {'key': 'backspacing', 'type': 'float'},
        {'key': 'load_rating', 'type': 'integer'},
        {'key': 'wheel_color', 'type': 'string'},
        {'key': 'wheel_finish', 'type': 'string'},
        {'key': 'wheel_material', 'type': 'string'},
        {'key': 'extra_tags', 'type': 'string'}
    ]
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

    // update product ui
    updateProductUI(product);
    
    const assistant_message = { content: response['response'], role: 'assistant', products: response['products'] };
    chatMessages.push(assistant_message);

    // Populate the chat window with the messages
    updateChatUI(loading=false);
}

function categoryChanged(category_name){
    let category = category_name;
    const form = document.getElementById('product-form');
    form.innerHTML = ''; // Clear existing fields

    for (let option of product_options[category]){
        let div = document.createElement('div');

        let label = document.createElement('label');
        label.htmlFor = option['key'];
        label.textContent = `${option['key'].replace(/_/g, ' ')}: `;

        let input = document.createElement('input');
        input.id = option['key'];
        input.name = option['key'];

        if (option['type'] === 'string') {
            input.type = 'text';
        } else if (option['type'] === 'float') {
            input.type = 'number';
            input.step = 'any';
        } else if (option['type'] === 'integer') {
            input.type = 'number';
            input.step = '1';
        }

        div.appendChild(label);
        div.appendChild(input);


        form.appendChild(div);

        input.addEventListener('change', () => updateProduct(option['key'], input.value));
    }
}




function updateProduct(key, value){
    product[key] = value;
    updateProductUI(product);
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
        url = document.getElementById('url-input').value || "https://www.tdotperformance.ca/all-all-all-parts/wheels-tires/wheels-rims?rims_vehicle_id=29922"
        chat_history = chatMessages.map(message => { return { content: message.content, role: message.role }});
        selected_products = [];
        for (let i = chatMessages.length - 1; i >= 0; i--){
            if (chatMessages[i].role === 'assistant'){
                selected_products = chatMessages[i].products.filter(product => product.isSelected);
                if (selected_products.length > 0){
                    break;
                }
            }
        }

        const response = await fetch(
            'https://heoaojza56rkjb7qd5f4tanycu0apume.lambda-url.us-east-1.on.aws/',
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
            "products": {}
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



function updateProductUI(object){
    copy = {...object};

    if ('wheel_size' in copy){
        copy['wheel_width'] = copy['wheel_size'].split('x')[0];
        copy['wheel_diameter'] = copy['wheel_size'].split('x')[1];
    }

    for (let key in copy){ 
        var input_field = document.getElementById(key);
        if (!input_field){
            continue;
        }
        input_field.setAttribute('value', copy[key]['name']);
    }
}


document.getElementById('message-form').addEventListener('submit', sendMessage);
categoryChanged(category);
updateChatUI();
