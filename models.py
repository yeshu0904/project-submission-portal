from datetime import datetime
from database import db

class ProjectSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    project_title = db.Column(db.String(200), nullable=False)
    project_description = db.Column(db.Text, nullable=False)
    project_url = db.Column(db.String(500))
    linkedin_url = db.Column(db.String(500))
    filename = db.Column(db.String(200))
    file_path = db.Column(db.String(500))
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_name': self.student_name,
            'email': self.email,
            'project_title': self.project_title,
            'project_description': self.project_description,
            'project_url': self.project_url,
            'linkedin_url': self.linkedin_url,
            'filename': self.filename,
            'submission_date': self.submission_date.strftime('%Y-%m-%d %H:%M:%S')
        }