TESTING SITE URL: https://kael558.github.io/TDotFrontEnd/

## Request params:
### chat_history
A list of Messages. Each object contains 2 properties: "role" and "content". 
 - "role" can be either "user" or "assistant".
 - "content" is the string message from either the user or the assistant

Example: 
```
let chat_history = [
  {
     "role": "user",
     "content": "I'm looking for gloss black wheels"
  },{
    "role": "assistant",
    "content": "Here are 3 options... etc"
  }
]
```

### url
The current url of the page that the user is on (contains the category of product and vehicle information)
Example:  `let url = "https://mcstaging.tdotperformance.ca/all-all-all-parts/wheels-tires/wheels?rims_vehicle_id=22698"`

### product_interpretations
Used to maintain the product attributes that the user is searching for. Populated by the return results of the request.

### vehicle_id
The url sometimes provides vehicle specs instead of an id (e.g. 2017-ford-f150) and it requires querying the backend to get the vehicle id. So instead, can just store it clientside and pass it in the request. Populated by the return results of the request.

### selected_products
I provided functionality that lets user's select specific products. See following image where first 2 products are selected. (This allows the user to select products that they want to examine further).
<img width="1440" alt="Screenshot 2024-01-10 at 3 16 24 PM" src="https://github.com/kael558/TDotFrontEnd/assets/26678074/84606b5a-609b-4acd-8cd6-6ea0b4ebb40f">

The logic is as follows:
- Finds the last suggested products within the chat_messages
- If any products are selected within that, then filter it down to those products, otherwise set selected_products to all of the latest suggested products.

### Request Example:
```
{  
    "url": "https://mcstaging.tdotperformance.ca/all-all-all-parts/wheels-tires/wheels?rims_vehicle_id=22698",  
    "chat_history": [{"role": "user", "content": "hi, how are you?"}],  
    "product_interpretations": [],  
    "selected_products": []  
}
```

## Response handling:
Basic flow to handle response from endpoint.
```
const response = await getResponse();
product_interpretations = response['product_interpretations']
vehicle_id = response['vehicle_id'] || vehicle_id;

// Remove unnecessary info from products
const products = response['products'].map(product => {
    return {
        name: product.name,
        price: product.price,
        sku: product.sku,
        custom_attributes: product.custom_attributes.filter(attribute => ['image', 'url_key'].includes(attribute.attribute_code)),
        description: product.description
    }
});

// You can ignore the debug stuff (as it's used for testing)
const assistant_message = { content: response['response'], role: 'assistant', products, debug: response['debug'], basic_debug: response['basic_debug'] };

// Maintain the internal state chatMessages as it's used to figure out which products are selected and also to see all previous products 
chatMessages.push(assistant_message);
```




