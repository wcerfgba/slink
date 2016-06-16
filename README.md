# s(elected)link

slink allows you to link to a selected segment of a Web page.

```put image here```


## How it works

1. User selects a portion of a Web page.
2. slink client polls `window.getSelection()` and detects an updated Selection 
   object.
3. slink client generates XPath-based specifiers for the selection start and 
   end.
4. User right-clicks to generate a slink.
5. slink client sends document.location and selection co-ordinates to slink 
   server.
6. slink server caches Web page with highlights embedded, generates link, and 
   returns it to client.
7. slink client displays link for user.
