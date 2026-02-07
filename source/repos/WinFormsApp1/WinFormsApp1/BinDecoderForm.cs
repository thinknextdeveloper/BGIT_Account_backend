using System.Text;

public class BinDecoderForm : Form
{
    private Button openButton;
    private TextBox outputBox;

    public BinDecoderForm()
    {
        // Set up form
        this.Text = "BIN File Decoder";
        this.Size = new Size(600, 400);

        // Add controls
        openButton = new Button
        {
            Text = "Open BIN File",
            Location = new Point(20, 20)
        };
        openButton.Click += OpenBinFile;

        outputBox = new TextBox
        {
            Multiline = true,
            ScrollBars = ScrollBars.Vertical,
            Location = new Point(20, 60),
            Size = new Size(540, 280)
        };

        this.Controls.Add(openButton);
        this.Controls.Add(outputBox);
    }

    private void OpenBinFile(object sender, EventArgs e)
    {
        OpenFileDialog openFileDialog = new OpenFileDialog();
        openFileDialog.Filter = "BIN files (*.bin)|*.bin|All files (*.*)|*.*";

        if (openFileDialog.ShowDialog() == DialogResult.OK)
        {
            try
            {
                byte[] fileBytes = File.ReadAllBytes(openFileDialog.FileName);
                string decodedContent = DecodeBinFile(fileBytes);
                outputBox.Text = decodedContent;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error: {ex.Message}");
            }
        }
    }

    private string DecodeBinFile(byte[] data)
    {
        // Implement your specific decoding logic here
        // This could be deserialization, custom decryption, etc.

        // Example: Simple ASCII decoding
        return Encoding.ASCII.GetString(data);

        // For complex formats, you might need more sophisticated parsing
    }
}