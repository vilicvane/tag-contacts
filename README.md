# Tag Contacts

Just another simple UI widget for entering emails as contacts. Check out a simple [demo](https://rawgit.com/vilic/tag-contacts/master/demo/index.html).

![Tag Contacts Preview](https://raw.github.com/vilic/tag-contacts/master/demo/preview.png)

This widget is based on an outsourcing project for [Jeffrey](http://www.web4py.com/).

## Browser Support

Internet Explorer 9+  
Chrome  
Firefox

## Usage

```javascript
/*
    preloaded data
*/

var data = [
    {
        id: 'id001',
        avatar: 'avatar.jpg',
        displayName: 'Tim Young',
        email: 'tim.young@test.com'
    }
];

$('#wrapper').tagContacts(data);


/*
    data queried with url
    the query will be sent with name q: url?q=...
    it should response with a JSON array contains the contacts information with the same format.
*/

$('#wrapper').tagContacts('your/api/url', {
    // minimum input width, default to 60 (px)
    minInputWidth: 60,
    // minimum dropdown width, default to 300 (px)
    minDropdownWidth: 300,
    // maximum items number in the dropdown list, default to 5
    maxItemNumber: 5,
    // minimum length to trigger the dropdown list, default to 1
    minLength: 1,
    // specify some contacts that have already been selected
    selectedContacts: [
        {
            id: 'id002',
            avatar: 'avatar.jpg',
            displayName: 'Tom Cat',
            email: 'tom.cat@test.com'
        }
    ],
    // handlers
    beforeAdd: function (id) {
        console.log('beforeAdd triggered with id', id);
        // return false to cancel adding
        return true;
    },
    beforeRemove: function (id) {
        console.log('beforeRemove triggered with id', id);
        // return false to cancel removing
        return true;
    },
    afterRemoved: function (id) {
        console.log('afterRemoved triggered with id', id);
    }
});
```