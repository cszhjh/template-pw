self.addEventListener('push', function (e) {
  console.log(e.data);
  const data = e.data.json();
  console.log(data, '--push-event');
  self.registration.showNotification(data.title, data);
});
