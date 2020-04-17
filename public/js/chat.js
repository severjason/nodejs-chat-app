const socket = io();

// Elements
const $messageForm = document.querySelector('form#message-form');
const $messageFormInput = document.querySelector('input#message');
const $messageFormButton = document.querySelector('button.send-message');
const $locationButton = document.querySelector('button.send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;
  if ($newMessage) {
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
      console.log('newMessageHeight', newMessageHeight);
      console.log('visibleHeight', visibleHeight);
      console.log('containerHeight', containerHeight);
      console.log('scrollOffset', scrollOffset);
      $messages.scrollTop = $messages.scrollHeight;
    }

  }
};

const parseMessage = ({text, createdAt, username}) => ({
  username,
  text,
  createdAt: moment(createdAt).format('hh:mm:ss'),
});

const showMessage = (template) => (message) => {
  const html = Mustache.render(template, parseMessage(message));
  autoscroll();
  $messages.insertAdjacentHTML('beforeend', html);
};


socket.on('message', showMessage(messageTemplate));

socket.on('locationMessage', showMessage(locationTemplate));

socket.on('roomData', (data) => {
  $sidebar.innerHTML = Mustache.render(sidebarTemplate, data);
});

const sendInputMessage = (event) => {
  event.preventDefault();
  if ($messageFormInput && $messageFormInput.value) {
    $messageFormButton.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', $messageFormInput.value, (error) => {
      $messageFormButton.removeAttribute('disabled');
      $messageFormInput.value = '';
      $messageFormInput.focus();
      if (error) {
        return console.log(error);
      }
      console.log('Message was delivered!');
    });

  }
};

const sendLocation = () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.');
  }
  $locationButton.setAttribute('disabled', 'disabled');
  navigator.geolocation.getCurrentPosition((position) => {
    const {latitude, longitude} = position.coords;
    socket.emit('sendLocation', {lat: latitude, lng: longitude}, () => {
      $locationButton.removeAttribute('disabled');
      console.log('Location shared')
    });
  }, (error) => {
    $locationButton.removeAttribute('disabled');
    console.log('Error: ', error);
  })
};

$messageForm.addEventListener('submit', sendInputMessage);

$locationButton.addEventListener('click', sendLocation);

socket.emit('join', {username, room}, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
