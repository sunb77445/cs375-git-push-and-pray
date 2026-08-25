const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('id');
let dest = document.getElementById("dest");
let dates = document.getElementById("dates");
let hotel = document.getElementById("hotel");
let addUser = document.getElementById("add");


fetch(`/trips${tripId}`).then(response => {
    return response.json();

}).then(data => {
    dest.textContent = `Trip to ${data.details[0].dest}`;
    dates.textContent = `Planned Dates: ${new Date(data.details[0].from_date).toLocaleDateString()} to ${new Date(data.details[0].to_date).toLocaleDateString()}`;
    formatHotel(data.hotel, hotel);

    console.log(data);

}).catch(error => {
    console.log(error);
});