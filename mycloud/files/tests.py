
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserFileModelTest(TestCase):
    def test_file_upload(self):
        user = User.objects.create_user(username='test', password='123')
        self.assertEqual(user.username, 'test')

