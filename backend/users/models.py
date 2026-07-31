from django.db import models
from django.contrib.auth.hashers import make_password

class PersonaUser(models.Model):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)

    # Optional fields for AI stylist
    skin_tone = models.CharField(max_length=50, blank=True, null=True)
    body_type = models.CharField(max_length=50, blank=True, null=True)
    face_shape = models.CharField(max_length=50, blank=True, null=True)
    undertone = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.username

    # Override save method to hash password automatically
    def save(self, *args, **kwargs):
        # Only hash if password is not already hashed
        if not self.password.startswith("pbkdf2_sha256$"):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)
