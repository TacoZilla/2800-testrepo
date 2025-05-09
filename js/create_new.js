
document.addEventListener('DOMContentLoaded', function () {

    document.querySelector('.cre-save-btn').addEventListener('click', () => {
        const data = {
            storageType: parseInt(document.getElementById('storageType').value.trim()),
            title: document.getElementById('locationname').value.trim(),
            street: document.getElementById('street').value.trim(),
            city: document.getElementById('city').value.trim(),
            province: document.getElementById('province').value.trim(),
            //image: document.getElementById('').value.trim(),
            description: document.getElementById('description').value.trim()

        };


        fetch(`/storage/createnew/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(() => {

                alert('Storage created in database');
                window.location.href = '/api/browse';
            })

            .catch(error => {
                console.error('error', error);
                alert('Error: ' + error.message);
            });
    });
});