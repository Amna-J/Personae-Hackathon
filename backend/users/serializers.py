
from rest_framework import serializers
from django.contrib.auth.hashers import check_password, make_password
from .models import PersonaUser

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonaUser
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = PersonaUser.objects.get(email=data['email'])
        except PersonaUser.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password")
        if not check_password(data['password'], user.password):
            raise serializers.ValidationError("Invalid email or password")
        return user


class ForgotCheckEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not PersonaUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


class ForgotResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        if not PersonaUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value

    def save(self):
        email = self.validated_data['email']
        new_password = self.validated_data['new_password']
        hashed = make_password(new_password)
        PersonaUser.objects.filter(email=email).update(password=hashed)

class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonaUser
        fields = ['skin_tone', 'body_type', 'face_shape','undertone', 'username']
        extra_kwargs = {
            'undertone':  {'required': False},
            'skin_tone':  {'required': False},
            'body_type':  {'required': False},
            'face_shape': {'required': False},
            'username':   {'required': False},    
        }