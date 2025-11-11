from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, jsonify
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from database import db
from models import ProjectSubmission

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///projects.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {
    'pdf', 'doc', 'docx', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 
    'pptx', 'txt', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm',
    'py', 'js', 'html', 'css', 'java', 'cpp', 'c', 'php', 'rb', 'go',
    'sql', 'json', 'xml', 'csv', 'xlsx', 'xls', 'ppt', 'psd', 'ai',
    'fig', 'sketch', 'xd', 'epub', 'mobi', 'tex', 'rmd', 'ipynb'
}

# Initialize database
db.init_app(app)

# Create upload directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit_project():
    try:
        # Get form data
        student_name = request.form.get('student_name')
        email = request.form.get('email')
        project_title = request.form.get('project_title')
        project_description = request.form.get('project_description')
        project_url = request.form.get('project_url')
        linkedin_url = request.form.get('linkedin_url')
        
        # Validate required fields
        if not all([student_name, email, project_title, project_description]):
            flash('Please fill all required fields', 'error')
            return redirect(url_for('index'))
        
        # Handle file upload
        file = request.files.get('project_file')
        filename = None
        file_path = None
        
        if file and file.filename != '':
            if allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Add timestamp to avoid filename conflicts
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{timestamp}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                # Save file without size restrictions
                file.save(file_path)
                file_size = os.path.getsize(file_path)
                file_size_mb = round(file_size / (1024 * 1024), 2)
                
                flash(f'File uploaded successfully! Size: {file_size_mb} MB', 'success')
            else:
                flash('File type not allowed', 'error')
                return redirect(url_for('index'))
        
        # Create new project submission
        new_submission = ProjectSubmission(
            student_name=student_name,
            email=email,
            project_title=project_title,
            project_description=project_description,
            project_url=project_url,
            linkedin_url=linkedin_url,
            filename=filename,
            file_path=file_path
        )
        
        db.session.add(new_submission)
        db.session.commit()
        
        flash('Project submitted successfully!', 'success')
        return redirect(url_for('success'))
        
    except Exception as e:
        db.session.rollback()
        flash(f'An error occurred while submitting your project: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/success')
def success():
    return render_template('success.html')

@app.route('/submissions')
def view_submissions():
    submissions = ProjectSubmission.query.order_by(ProjectSubmission.submission_date.desc()).all()
    return render_template('submissions.html', submissions=submissions)

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

@app.route('/view_upload/<filename>')
def view_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# DELETE ROUTES - UPDATED WITH BETTER ERROR HANDLING
@app.route('/delete_submission/<int:submission_id>', methods=['POST'])
def delete_submission(submission_id):
    try:
        submission = ProjectSubmission.query.get_or_404(submission_id)
        
        # Delete associated file if exists
        if submission.filename and submission.file_path:
            try:
                if os.path.exists(submission.file_path):
                    os.remove(submission.file_path)
            except Exception as e:
                print(f'Warning: Could not delete file: {str(e)}')
                # Continue with database deletion even if file deletion fails
        
        # Delete from database
        db.session.delete(submission)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Submission deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting submission {submission_id}: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error deleting submission: {str(e)}'
        }), 500

@app.route('/delete_all_submissions', methods=['POST'])
def delete_all_submissions():
    try:
        submissions = ProjectSubmission.query.all()
        deleted_count = 0
        
        for submission in submissions:
            # Delete associated file if exists
            if submission.filename and submission.file_path:
                try:
                    if os.path.exists(submission.file_path):
                        os.remove(submission.file_path)
                except Exception as e:
                    print(f'Warning: Could not delete file {submission.filename}: {str(e)}')
            
            db.session.delete(submission)
            deleted_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': f'All {deleted_count} submissions deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting all submissions: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error deleting all submissions: {str(e)}'
        }), 500

# Error handler to ensure JSON responses even for errors
@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/delete'):
        return jsonify({'success': False, 'message': 'Resource not found'}), 404
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    if request.path.startswith('/delete'):
        return jsonify({'success': False, 'message': 'Internal server error'}), 500
    return render_template('500.html'), 500

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)