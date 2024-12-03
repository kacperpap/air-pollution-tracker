def log_to_file(file, name, content, header=None):
    def format_nested_dict(d, indent=0):
        result = ""
        for k, v in d.items():
            result += "  " * indent + f"{k}: "
            if isinstance(v, dict):
                result += "\n" + format_nested_dict(v, indent + 1)
            elif isinstance(v, list):
                result += "\n"
                for item in v:
                    if isinstance(item, dict):
                        result += "  " * (indent + 1) + format_nested_dict(item, indent + 2)
                    else:
                        result += "  " * (indent + 1) + f"{item}\n"
            else:
                result += f"{v}\n"
        return result

    file.write(f"FUNCTION NAME: {name}\n")
    if header:
        file.write(f"HEADER: {header}\n")
    
    if isinstance(content, dict):
        content = format_nested_dict(content)
    elif isinstance(content, list):
        formatted_content = ""
        for item in content:
            if isinstance(item, dict):
                formatted_content += format_nested_dict(item) + "\n"
            else:
                formatted_content += str(item) + "\n"
        content = formatted_content
    
    file.write(content + "\n")
    file.write("\n\n")