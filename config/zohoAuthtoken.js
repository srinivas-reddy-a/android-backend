import { request } from "express";
const options={
    url:'https://inventory.zoho.com/api/v1/items',
    method: 'GET',
    headers:{
        'Content-Type': 'application/json',
        'Authorization': 'Zoho-oauthtoken 1000.2fb1401b867c89cab70fb86034dd0633.e9188f14e5f8e8e81f9b2bb1ddf0a322'
    },
}
const params = {
    'organization_id':60012963145
}

request({options, qs:params},  (error, response) => {
    return;
});