document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const storageId = urlParams.get('storageId');

    localStorage.setItem('storageId', storageId);
    if (!storageId) {
        console.error('No storage ID in URL');
    }

     
    // Edit fridge name
    document.querySelector('.storage-title .edit-btn').addEventListener('click', () => {
        const nameEl = document.getElementById('storageName');
        const isEditable = nameEl.getAttribute('contenteditable') === 'true';
        nameEl.setAttribute('contenteditable', !isEditable);
        nameEl.focus();
    });

    // Initial setup
    initalData(storageId);

    // Upload photo
    const uploadTrigger = document.getElementById('uploadTrigger');
    const coverPhotoInput = document.getElementById('coverPhotoInput');
    const photoPreview = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');

    if (uploadTrigger && coverPhotoInput) {
        uploadTrigger.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default button behavior
            coverPhotoInput.click();
        });

        coverPhotoInput.addEventListener('change', function (e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];

                if (!file.type.match('image.*')) {
                    alert('Please select an image file (JPEG, PNG, etc.)');
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be less than 5MB');
                    return;
                }
                const reader = new FileReader();

                reader.onload = function (e) {
                    if (e.target && e.target.result) {
                        previewImage.src = e.target.result;
                        photoPreview.style.display = 'block';
                        uploadPhoto(file, storageId);
                    } else {
                        console.error("FileReader result is null");
                        alert("Failed to preview image.");
                    }
                };
        
                reader.onerror = function (error) {
                    console.error("FileReader error:", error);
                    alert("Error reading file.");
                };
        
                reader.readAsDataURL(file);
            }
        });

        async function uploadPhoto(file, storageId) {
            const formData = new FormData();
            formData.append('photo', file);

            try {
                const response = await fetch(`/manage/storage/upload?storageId=${storageId}`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const result = await response.json();
                alert('Photo uploaded successfully!');

                console.log('result after upload',result);

                if(!result.image){
                    document.getElementById('previewImage').src = '#';

                } else {
                document.getElementById('previewImage').src = result.image;
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Error uploading photo: ' + error.message);
                photoPreview.style.display = 'none';
            }
        }
    }
});

function toggleEdit(fieldId) {
    const field = document.getElementById(fieldId);
    field.disabled = !field.disabled;

    // Special handling for select elements
    if (field.tagName === 'SELECT' && !field.disabled) {
        field.focus();
    } else if (!field.disabled) {
        field.focus();
    }
}

function toggleAddressEdit() {
    const fieldIds = ['street', 'city', 'province'];

    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.disabled = !field.disabled;
        }
    });
}

function openModal() {
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

function initalData(storageId) {
    // Save button click handler
    document.querySelector('.man-save-btn').addEventListener('click', function () {
        saveStorageData(storageId);
    });

    // Delete confirmation handler
    document.getElementById('confirmDelete').addEventListener('click', function () {
        softDeleteStorage(storageId);
    });

}


async function saveStorageData(storageId) {
    const lastCleanedInput = document.getElementById('lastCleaned').value;

    const data = {
        title: document.getElementById('storageName').textContent.trim(),
        city: document.getElementById('city').value.trim(),
        street: document.getElementById('street').value.trim(),
        province: document.getElementById('province').value.trim(),
        lastCleaned: (lastCleanedInput && lastCleanedInput.trim() !== '')
            ? `${lastCleanedInput}:00`
            : null,
        storageType: parseInt(document.getElementById('storageTypeSelect').value)
    };

    await fetch(`/manage/storage?storageId=${storageId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {

            console.log('data', data);
            alert('Storage updated successfully!');

            // Update the displayed type text
            document.getElementById('storageType').textContent =
                data.type === 1 ? 'Community Fridge' : 'Community Pantry';

            // Disable all edited fields
            ['street', 'city', 'province', 'lastCleaned', 'storageTypeSelect'].forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.disabled = true;
            });
            document.getElementById('storageName').contentEditable = 'false';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating storage');
        });
}

async function softDeleteStorage(storageId) {
    try {
        const response = await fetch(`/manage/storage/soft-delete?storageId=${storageId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Storage archived successfully!');
            window.location.href = '/browse'; // Redirect after success
        } else {
            throw new Error('Failed to archive storage');
        }
    } catch (error) {
        console.error(error);
        alert('Error: ' + error.message);
    }
}

