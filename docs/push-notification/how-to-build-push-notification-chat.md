0:00
in this video I'm going to show you how
0:01
I Implement web push notification for my
0:03
pwa application and on the left side
0:06
right here this is application that run
0:07
on Chrome and on the right side right
0:09
here this application run on the iOS
0:12
device and right now when I click on
0:14
approve this one so as you can see right
0:17
now it's going to push the notifications
0:19
to my phone and when I click on the
0:21
notification it open UPS the application
0:24
so it feel like a native application and
0:26
with a notification as well and right
0:29
now for example inside this phone right
0:31
here and if I going to click on approve
0:34
for example so there's going to be a
0:36
push notification on the Chrome device
0:38
right here as well so this is really
0:40
great uh for if you wanted to implement
0:42
a notification for example chat
0:44
application and so right now let's see
0:46
how I do it to implement a web push
0:49
notification is really easy so the first
0:51
step that you need to do you need to
0:52
have the service worker so the service
0:54
worker is running on the background and
0:57
it's run on the different thre from your
0:59
applic
1:00
so it is not going to relate it to your
1:02
application so that's why we can do the
1:04
things on the background such as push
1:06
notification and things like that so
1:08
what you need to do is you need to
1:10
register the service worker inside your
1:13
applications and after you you register
1:15
it you can use it to generate the
1:17
subscription end point that look
1:19
something like this and so this is going
1:21
to be a little bit different from the
1:23
browser the example that I show you here
1:25
so this is the example that I run on the
1:28
Chrome and if you run it on the Firefox
1:30
or stery so this one is going to be a
1:33
little bit different so when you
1:34
generate this endpoint right here you
1:36
can save this one inside your users
1:39
table that belong to them and later on
1:43
you can use this one to push uh with
1:45
this payload and the message and it's
1:48
going to push the notification to the
1:49
browser where it's going where it
1:52
subscribed to so in order to do this one
1:54
we going to use the web push uh package
1:57
right here and so that's how we do it so
2:00
based on this diagram okay so right now
2:03
let's take a look on how I implement
2:04
this one inside the code so this is my
2:07
next year's application and so first I
2:10
want to convert this application into
2:12
the pwa so what I did I'm using the next
2:16
package called Next pwa and so I just
2:19
wrap this one right here so you can see
2:21
really easy so I just point to the
2:23
destination into the public folder and I
2:25
do register it true but actually when I
2:28
do register is true right here it's
2:31
actually not registered and I'm not sure
2:34
why it's maybe it's due to the app
2:36
router because I test this one on the
2:39
page router it's actually register so to
2:41
confirm that if your application is
2:44
registered with service worker or not
2:46
you can go into the application so for
2:48
example this one and you can go to the
2:50
applications and go to service worker
2:53
and as you can see we have the value
2:55
right here so if you do not see any
2:57
something like this so it's mean that
2:59
the service worker is not register so
3:02
for me in order to register the service
3:04
worker I need to create the Customs
3:06
component called pwa right here because
3:09
see the library is not generated uh
3:11
registered for me I need to do this one
3:14
so I just do Navigator so is worker
3:16
register then this one right here as you
3:19
can see so the file that you can see
3:21
like s W.J right here so this this is
3:25
the file so this file is generated for
3:28
you by the package of the next pwa right
3:32
here so this is when happen when you run
3:34
npm run bill or npm run Dave or you can
3:37
disable it when on the development mode
3:39
as well so this is like a generate for
3:42
you and you can use this to register all
3:44
right so once the I confirm that my
3:47
application is registered with the uh
3:49
service worker I create the component
3:52
called the notification request so
3:55
inside this notification request I have
3:58
two components uh for this one so I have
4:00
bell ring and Bell off and so the Bell
4:03
off right here so it mean when a user
4:04
click on it it mean the user want to
4:06
have notification and if the user click
4:09
on bell ring it mean that the user want
4:11
to remove the
4:12
notifications so for the Bell off so
4:15
when the user click on it we're going to
4:16
show notification and if you look at the
4:18
function right here so what it does is
4:21
going to ask the user the permission
4:23
that we wanted to push notification to
4:26
the browser are you going to allow it or
4:28
not so and it looks something like this
4:31
for for example I click on this one and
4:34
as you can see we have the allow of
4:36
block so right now when we click on
4:38
allow and the status is going to be
4:41
granted and it's going to call this
4:43
function the Subscribe user right here
4:46
okay so for example if the user click
4:49
block and the user do not want to push
4:53
notification so if the user do that we
4:56
cannot generate or subscribe the user so
4:59
basically going to TS them to something
5:01
else and if they want to reenable if
5:04
they let's say if they click block and
5:06
if they want to enable it back so they
5:08
have to manually enable it by themselves
5:11
so they have to go for example here and
5:13
toggle the notification and if you using
5:16
the pwa they have to go on their phones
5:19
and to check the notification of the
5:21
application and reenable it by their own
5:24
because I think we do not have like the
5:26
function to reset the permission request
5:29
on the browser with the with the code so
5:32
the user need to do that on their own so
5:35
that's what they need to if they block
5:37
and they want to reenable the
5:38
notification hopefully it's not
5:39
confusing so after they click on that so
5:42
we call the Subscribe user let's go
5:44
ahead and the function subscribe user
5:46
right here so inside the Subscribe user
5:48
right here so first I need to make sure
5:50
that my service worker is registered so
5:53
I get the register service worker and if
5:55
it's register already so I'm calling
5:57
another function to subscribe the end
5:59
point Co and if they haven't subscribed
6:02
yet so I'm just do another subscribe
6:05
right here again and we call the
6:07
subscribes endpoint right here okay and
6:09
if you look at the generate subscribe
6:11
endpoint it need the service worker as a
6:14
parameter and so what it needs what it
6:17
does right here so first uh it just do
6:20
the push notification and it subscri
6:23
manager and then subscribe with the
6:24
option and the option right here it need
6:26
the application server key and the user
6:30
visibility true so the user visibility
6:33
true right here so this is just the
6:35
mandatory in Chrome probably Firefox is
6:37
optional so we we just need to put this
6:40
through so it's going to be good for all
6:42
both of all of browser and for the
6:45
application secret key right here or we
6:47
call it like the vapit key right here so
6:50
this is needed for the browser and the
6:52
server to communicate and authenticate
6:54
so we need to know that okay uh so syn
6:57
this is generate the end point right so
6:59
we need to give them a key and the key
7:02
is later on they can use it to validate
7:04
whether this is like you know
7:05
authenticate or not so if you want to
7:08
generate this key you can use this
7:09
package web push right here and the web
7:12
push right here has the command to
7:13
generate right here and so right now if
7:16
for example this is what it look like
7:18
when you run this one it's going to give
7:19
you the public key and the private key
7:22
and so the P public key right herey you
7:24
can save it into your local EnV and save
7:27
this one into your uh local EnV as well
7:30
so but this is public so it's fine to
7:32
expose it but make sure that this one do
7:34
not expose your private key all
7:36
right so when you have this one and then
7:41
uh when we generate the subscription
7:42
right here we it's look it's going to
7:44
look something like what I show you this
7:47
one and so what I use is just use it to
7:50
save through the the table I called in
7:53
the notification table and I save it's
7:55
there so it's right now it's belong to
7:58
the user who requesting it and it's save
8:00
it's there and then if they have an
8:02
error toss error not just refresh or
8:04
refres the user information again and so
8:07
that's what I did it's really easy and
8:10
if you curious about this function right
8:12
here so this function it just convert uh
8:15
the uh B 64 to this one and so it's
8:18
really easy uh it's really uh easy right
8:21
here and so basically I just copy and
8:22
paste as well I'm just going to show you
8:24
where the source that I copy paste later
8:26
on okay great so right now we know how
8:30
to generate the subscription endpoint
8:32
right here we save it to the users table
8:34
as well it's all good to go and right
8:36
now let's see how I use it so in order
8:39
to push the notification I create
8:41
another function it is a server action
8:44
which is going to run on the server and
8:47
you can use this one on the uh create an
8:50
API endpoint to do it as well but I
8:52
think for creating an API endpoint you
8:54
need to protect the API endpoint as well
8:56
which I think create a server action is
8:58
going to be easy
9:00
uh since you know next year be able to
9:02
do it so I'm just using it so inside
9:05
here I just get the rapet key so create
9:08
an object of it public and a private key
9:10
and we just use web push package which
9:13
is this one and so for that we need to
9:15
get a weit detail which is the emails
9:18
and the public and private so this is
9:20
you can just copy use the same as one
9:23
you could just fake email it's fine as
9:24
well right here and just make sure the
9:28
public key and private key here is the
9:30
same that you use when you use to
9:33
generate the subscription right here
9:35
okay and so when you have this one so
9:38
basically uh all you all I need to do
9:40
next is to fetch the end point of the
9:42
user that I want to push to so right
9:45
here I fetch from the notification from
9:48
the user uh and then I pass the user
9:51
program right here so I fetch this one
9:54
and if we have an error I just respond
9:55
with an error and if I have the data and
9:58
then I can push notification so what we
10:01
do we just web push send
10:03
notification and since I save before the
10:06
endp point as the string of Json so I
10:10
need to pass it again so I get this one
10:12
and then I pass this one and this is the
10:15
message that I wanted to send to the
10:16
user so inside this message I sent with
10:20
the message icon and the body I
10:23
stringify it so right now it's become
10:25
like a string and I push this one okay
10:28
so this is uh how I push the
10:30
notification and yeah so right now how
10:35
do the th worker send a notification so
10:38
if you look at the service worker I
10:40
create the service
10:43
worker file which is the custom file
10:45
right here this is like the worker
10:47
index.js so thews right here is also
10:50
service worker but this like the
10:52
autogenerate for you when you run builds
10:55
or in development mode but if you want
10:57
to have a custom service worker you need
10:59
to create the folder called
11:01
worker and create index.js and it's
11:04
going to generate it's going to look
11:06
something like this okay if we can save
11:08
so you can see this is the same as we
11:10
see here great so right now inside this
11:14
one which is responsible for two events
11:16
so the first event is when we push the
11:19
notification so when whenever we call
11:22
this push so it's going to trigger this
11:24
push event right here and we going to
11:26
get the data that uh from the the
11:29
function right so this function is is
11:31
sending text of Json which is have the
11:34
message icon and the body right and
11:36
inside here after we receive it we can
11:40
pass it again and D structure we have
11:42
the message the body and the icon and so
11:46
we can just show notification so with
11:48
the message show with the body and the
11:50
icon right here so it's really easy so
11:53
you can
11:54
see and another event is just
11:56
notification click and so when the user
11:58
click on this one it just click on the
12:00
notification that pop up it's going to
12:02
reopen it or open the your application
12:06
and this is really easy so I just copy
12:08
and paste uh this code right here all
12:11
right great so that pretty much it on
12:14
how I Implement so right now let's see
12:16
where I use this send notification right
12:18
here so we can search this one I call
12:21
this one whenever the new Quest is
12:24
complete so when the user let's say uh
12:26
when the user click on or when us a
12:29
complete a quest or create a new Quest
12:31
or approve a quest I just call this
12:34
function right here and you can see I
12:36
create the hand off push notifications
12:38
and then this is in the uh client
12:41
component I guess yeah and when it's on
12:45
click it's called the handle push
12:48
notification so that pretty much it so
12:50
right now with this function you can
12:51
call whatever you want whenever you want
12:53
it's up to you uh based on your
12:56
applications and so yeah yeah that's how
12:59
you implement it so it's really easy to
13:03
uh do this
13:04
one and yeah you can take a look at the
13:06
code uh I put the link to the source
13:09
code of this project as well and yeah
13:12
let me know in the comments what do you
13:13
think and I really enjoy you know
13:16
working with pwa and things like that
13:18
the applications right now about this
13:20
application
13:21
it's I I need a couple more feature it's
13:24
not working really well I just do the
13:26
notification it's fun to learn and build
13:28
it so that's why I wanted to show to you
13:31
guys how I implement it and yeah uh and
13:35
for the resource of it uh I you can take
13:37
a look at this blog post right here this
13:38
is what I get the inspiration from it
13:40
since 2018 but it still work and also by
13:44
the way of on the iOS you need to have
13:47
the version uh 16.4 Plus in order to uh
13:52
notification to work on your iOS D
13:55
otherwise it's not going to work so for
13:57
the older iOS D it's not working for the
14:00
latest it's going to work so make sure
14:01
you double check on your iOS Dy as well
14:04
if you it's not working for you um
14:08
and yeah I think that's all uh that I
14:11
wanted to share in this video hopefully
14:13
you learned something and hopefully you
14:14
like this uh video and all right see you
14:19
in the next video
