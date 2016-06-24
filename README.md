# s(election)link

slink allows you to link to a selected segment of a Web page.

```put image here```


## Use

1. Select a portion of a Web page.
2. Trigger slink (context menu, keybinding, bookmarklet, ...).
3. A new tab opens with your slink.


## Backend

### API

* **POST** `/new` - Takes the document text, location, and selection pointers 
  and on success responds with a 403 to the slink.
* **GET** `/:id(\\d+)` - Retrieves and serves the slink with the specified ID.
* **GET** `/verification/:id(\\d+)` - Retrieves and serves the verifiation page
   for the specified ID.


### Creating a slink

1. Receive client POST with 
   `text` (HTML of the current document in browser), 
   `location` (URL of current document), and
   `pointers` (XPaths and text offsets of start and end of selection).
2. Retrieve `location` and build a DOM for the retrieved and submitted texts 
   with [jsdom][1].
3. Compare the DOMs with [diffDOM][2]. If the pages are equal, we can mark the 
   slink as verified.
4. Manipulate the submitted DOM: links to external assets must be made 
   absolute, and we must apply highlighting and insert a banner with the 
   metadata.
5. Serialize the manipulated DOM and store in the database.
6. Respond to the client with a redirect to the slink.

[1]: https://github.com/tmpvar/jsdom
[2]: https://github.com/fiduswriter/diffDOM


## License

All files in `exern/` are copyright their respective authors.

All files in `artwork/` and `website/` represtent marketing IP for the official 
slink.to server, and as such are copyright John Preston 2016.

All other files are licensed under
[the MIT license](https://opensource.org/licenses/mit-license.php).

In other words, feel free to use the code for whatever you like, but if you're 
setting up a public slink server, don't use the same marketing materials because 
you are unofficial.
